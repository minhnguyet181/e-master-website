/**
 * bookImport.controller.js
 * Handles full-book ZIP import: 1 PDF + N MP3s → parse all tests → import to DB.
 *
 * ZIP structure expected:
 *   *.pdf                          — the full book PDF
 *   Test 1 - Section 1.mp3        — audio files (pattern: Test N - Section M)
 *   Test 1 - Section 2.mp3
 *   ...
 *
 * Flow:
 *   1. Extract ZIP in memory
 *   2. Identify PDF + audio files
 *   3. Parse PDF text with pdf-parse
 *   4. Split PDF text into per-test chunks (Test 1, Test 2, ...)
 *   5. For each test, split into skills (Reading, Listening, Writing, Speaking)
 *   6. Call AI to parse each skill section
 *   7. Map audio files to listening test sections
 *   8. Import all tests to DB
 */

require('dotenv').config();
const AdmZip = require('adm-zip');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const Test = require('../models/test.model');
const TestSection = require('../models/testSection.model');
const TestQuestion = require('../models/testQuestion.model');
const { applyTestV2Associations } = require('../models/testV2.associations');
const NO_AI_IMPORT = ['1', 'true', 'yes', 'on'].includes(String(process.env.NO_AI_IMPORT || '').toLowerCase());

// ── AI helpers ────────────────────────────────────────────────────────────────

function normalizeGeminiKey(raw) {
  if (!raw) return '';
  let k = String(raw).trim();
  if (k.charCodeAt(0) === 0xfeff) k = k.slice(1).trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1).trim();
  const fromUrl = k.match(/[?&]key=([^&]+)/);
  if (fromUrl) {
    try {
      k = decodeURIComponent(fromUrl[1]);
    } catch {
      k = fromUrl[1];
    }
  }
  if (k.startsWith('yAIza')) k = k.slice(1);
  return k.trim();
}

function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch {} }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) { try { return JSON.parse(text.slice(start, end + 1)); } catch {} }
  return null;
}

async function callGemini(prompt) {
  const key = normalizeGeminiKey(process.env.GEMINI_API_KEY);
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const model = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.post(url, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192, topP: 0.95 },
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
      if (res.data.error) throw new Error(res.data.error.message);
      return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      const status = err.response?.status;
      if ((status === 503 || status === 429) && attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 15000));
      } else throw err;
    }
  }
}

async function callAI(prompt) {
  try {
    return await callGemini(prompt);
  } catch (err) {
    const geminiStatus = err.response?.status;
    const geminiMsg = err.response?.data?.error?.message || err.message;
    const hasOpenAIKey = !!String(process.env.OPENAI_API_KEY || '').trim();
    const shouldFallbackToOpenAI =
      !normalizeGeminiKey(process.env.GEMINI_API_KEY) ||
      geminiStatus === 429 ||
      geminiStatus === 500 ||
      geminiStatus === 502 ||
      geminiStatus === 503;

    if (hasOpenAIKey && shouldFallbackToOpenAI) {
      try {
        const res = await axios.post(
          process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
          { model: process.env.OPENAI_MODEL || 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 8192 },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 120000 }
        );
        return res.data?.choices?.[0]?.message?.content || '';
      } catch (openAIError) {
        const openAIStatus = openAIError.response?.status;
        const openAIMsg = openAIError.response?.data?.error?.message || openAIError.message;
        throw new Error(`Gemini failed (${geminiStatus || 'no-status'}): ${geminiMsg}; OpenAI fallback failed (${openAIStatus || 'no-status'}): ${openAIMsg}`);
      }
    }

    throw new Error(`Gemini failed (${geminiStatus || 'no-status'}): ${geminiMsg}`);
  }
}

// ── PDF splitting ─────────────────────────────────────────────────────────────

/**
 * Split full-book PDF text into per-test chunks.
 * Detects "Test 1", "TEST 1", "Practice Test 1" etc.
 */
function splitByTest(fullText) {
  // Match "Test 1", "TEST 1", "Practice Test 1", "PRACTICE TEST 1"
  const testHeaderRe = /(?=(?:Practice\s+)?Test\s+\d+\b)/gi;
  const parts = fullText.split(testHeaderRe).filter(p => p.trim().length > 200);

  if (parts.length <= 1) return null; // Can't split — return null to process as single block

  const tests = [];
  for (const part of parts) {
    const numMatch = part.match(/(?:Practice\s+)?Test\s+(\d+)/i);
    if (numMatch) {
      tests.push({ testNo: parseInt(numMatch[1]), text: part });
    }
  }
  return tests.length ? tests : null;
}

/**
 * Within a single test's text, split by skill section.
 * Returns { reading, listening, writing, speaking, answerKey }
 */
function splitBySkill(testText) {
  const sections = {};

  // Patterns to detect skill boundaries
  const boundaries = [
    { key: 'reading',   re: /(?=\b(?:READING|Reading\s+Test|READING\s+PASSAGE)\b)/i },
    { key: 'listening', re: /(?=\b(?:LISTENING|Listening\s+Test|LISTENING\s+SECTION)\b)/i },
    { key: 'writing',   re: /(?=\b(?:WRITING|Writing\s+Task|WRITING\s+TEST)\b)/i },
    { key: 'speaking',  re: /(?=\b(?:SPEAKING|Speaking\s+Test|SPEAKING\s+PART)\b)/i },
    { key: 'answerKey', re: /(?=\b(?:ANSWER\s+KEY|ANSWERS|Answer\s+Key)\b)/i },
  ];

  // Find positions of each skill section
  const found = [];
  for (const { key, re } of boundaries) {
    const match = re.exec(testText);
    if (match) found.push({ key, pos: match.index });
  }
  found.sort((a, b) => a.pos - b.pos);

  for (let i = 0; i < found.length; i++) {
    const start = found[i].pos;
    const end = i + 1 < found.length ? found[i + 1].pos : testText.length;
    sections[found[i].key] = testText.slice(start, end).trim();
  }

  // If no skill boundaries found, treat entire text as reading (most common)
  if (!Object.keys(sections).length) {
    sections.reading = testText;
  }

  return sections;
}

// ── AI prompts ────────────────────────────────────────────────────────────────

function buildSkillPrompt(skill, text, code, name, answerKeyText = '') {
  const answerSection = answerKeyText
    ? `\n\nANSWER KEY (use this to fill correct_answer fields):\n---\n${answerKeyText.slice(0, 3000)}\n---`
    : '';

  const schemas = {
    reading: `{
  "code": "${code}", "name": "${name}", "test_type": "reading", "duration_minutes": 60, "level": "IELTS",
  "sections": [{
    "section_no": 1, "title": "Passage 1 – <title>",
    "passage_text": "<full passage text>", "audio_url": null, "image_url": null,
    "content": { "passageTitle": "<title>", "passageText": "<full passage text>" }, "media": null,
    "questions": [{
      "question_no": 1,
      "question_type": "TRUE_FALSE_NOT_GIVEN|MULTIPLE_CHOICE|FILL_IN_THE_BLANK|MATCHING|SUMMARY_COMPLETION|TABLE_COMPLETION|SENTENCE_COMPLETION|SHORT_ANSWER",
      "prompt": "<question>", "options": ["TRUE","FALSE","NOT GIVEN"], "correct_answer": "<answer>", "points": 1, "metadata": {}
    }]
  }], "metadata": {}
}
Rules: Include ALL 3 passages as separate sections. Include ALL questions with correct_answer filled from answer key.`,

    listening: `{
  "code": "${code}", "name": "${name}", "test_type": "listening", "duration_minutes": 30, "level": "IELTS",
  "sections": [{
    "section_no": 1, "title": "Section 1", "passage_text": null, "audio_url": null, "image_url": null, "content": null, "media": null,
    "questions": [{
      "question_no": 1,
      "question_type": "FILL_IN_THE_BLANK|MULTIPLE_CHOICE|TABLE_COMPLETION|MAP_LABELLING|MATCHING",
      "prompt": "<question>", "options": null, "correct_answer": "<answer>", "points": 1, "metadata": {}
    }]
  }], "metadata": {}
}
Rules: Extract all 4 sections. Fill correct_answer from answer key. audio_url will be set separately.`,

    writing: `{
  "code": "${code}", "name": "${name}", "test_type": "writing", "duration_minutes": 60, "level": "IELTS",
  "sections": [
    { "section_no": 1, "title": "Task 1", "passage_text": null, "audio_url": null, "image_url": null,
      "content": { "task_type": "task1", "question": "<task 1 prompt>" }, "media": null,
      "questions": [{ "question_no": 1, "question_type": "WRITING_TASK", "prompt": "<task 1 prompt>", "options": null, "correct_answer": null, "points": 150, "metadata": {} }]
    },
    { "section_no": 2, "title": "Task 2", "passage_text": null, "audio_url": null, "image_url": null,
      "content": { "task_type": "task2", "question": "<task 2 prompt>" }, "media": null,
      "questions": [{ "question_no": 1, "question_type": "WRITING_TASK", "prompt": "<task 2 prompt>", "options": null, "correct_answer": null, "points": 250, "metadata": {} }]
    }
  ], "metadata": {}
}`,

    speaking: `{
  "code": "${code}", "name": "${name}", "test_type": "speaking", "duration_minutes": 15, "level": "IELTS",
  "sections": [
    { "section_no": 1, "title": "Part 1", "passage_text": null, "audio_url": null, "image_url": null,
      "content": { "topic": "<topic>" }, "media": null,
      "questions": [{ "question_no": 1, "question_type": "SPEAKING_PROMPT", "prompt": "<question>", "options": null, "correct_answer": null, "points": 0, "metadata": {} }]
    }
  ], "metadata": {}
}`,
  };

  return `You are an IELTS test data extractor. Extract the ${skill.toUpperCase()} test content and return ONLY valid JSON in a \`\`\`json\`\`\` block.

SCHEMA:
\`\`\`json
${schemas[skill] || schemas.reading}
\`\`\`

PDF TEXT (${skill.toUpperCase()} section):
---
${text.slice(0, 20000)}
---${answerSection}`;
}

function extractAnswerMap(answerKeyText = '') {
  const map = {};
  if (!answerKeyText) return map;
  const lines = answerKeyText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^(\d+)\s*[\).\:-]?\s*(.+)$/);
    if (!m) continue;
    const qNo = Number(m[1]);
    const answer = m[2].trim();
    if (qNo && answer) map[qNo] = answer;
  }
  return map;
}

function splitBlocksByHeader(text, headerRegex) {
  const normalized = String(text || '');
  const matches = [...normalized.matchAll(headerRegex)];
  if (!matches.length) return [{ title: null, body: normalized }];

  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const start = cur.index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? normalized.length) : normalized.length;
    blocks.push({
      title: cur[0].trim(),
      body: normalized.slice(start, end).trim(),
    });
  }
  return blocks;
}

function extractQuestionsFromText(text, answerMap, defaultType) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const questions = [];
  let current = null;

  for (const line of lines) {
    const qMatch = line.match(/^(\d{1,3})\s*[\).\:-]\s*(.+)$/);
    if (qMatch) {
      if (current) questions.push(current);
      const qNo = Number(qMatch[1]);
      current = {
        question_no: qNo,
        question_type: defaultType,
        prompt: qMatch[2].trim(),
        options: null,
        correct_answer: answerMap[qNo] || null,
        points: 1,
        metadata: {},
      };
      continue;
    }

    const optionMatch = line.match(/^([A-D])\s*[\).\:-]\s*(.+)$/i);
    if (optionMatch && current) {
      if (!Array.isArray(current.options)) current.options = [];
      current.options.push(`${optionMatch[1].toUpperCase()}. ${optionMatch[2]}`);
      if (current.question_type === 'FILL_IN_THE_BLANK') {
        current.question_type = 'MULTIPLE_CHOICE';
      }
      continue;
    }

    if (current) {
      current.prompt = `${current.prompt} ${line}`.trim();
    }
  }

  if (current) questions.push(current);

  if (!questions.length) {
    const fallbackPrompt = lines.slice(0, 40).join(' ').slice(0, 1200) || 'Question content extracted from PDF';
    questions.push({
      question_no: 1,
      question_type: defaultType,
      prompt: fallbackPrompt,
      options: null,
      correct_answer: answerMap[1] || null,
      points: 1,
      metadata: { generated: 'rule_based_fallback' },
    });
  }

  return questions;
}

function buildRuleBasedTestJSON(skill, text, code, name, answerKeyText) {
  const answerMap = extractAnswerMap(answerKeyText);
  const base = {
    code,
    name,
    level: 'IELTS',
    metadata: { parser: 'rule_based_pdf_parse' },
  };

  if (skill === 'reading') {
    const blocks = splitBlocksByHeader(text, /(Passage\s+\d+|READING\s+PASSAGE\s+\d+)/gi);
    return {
      ...base,
      test_type: 'reading',
      duration_minutes: 60,
      sections: blocks.map((b, idx) => ({
        section_no: idx + 1,
        title: b.title || `Passage ${idx + 1}`,
        passage_text: b.body || null,
        audio_url: null,
        image_url: null,
        content: { passageTitle: b.title || `Passage ${idx + 1}`, passageText: b.body || '' },
        media: null,
        questions: extractQuestionsFromText(b.body, answerMap, 'FILL_IN_THE_BLANK'),
      })),
    };
  }

  if (skill === 'listening') {
    const blocks = splitBlocksByHeader(text, /(Section\s+\d+|LISTENING\s+SECTION\s+\d+)/gi);
    return {
      ...base,
      test_type: 'listening',
      duration_minutes: 30,
      sections: blocks.map((b, idx) => ({
        section_no: idx + 1,
        title: b.title || `Section ${idx + 1}`,
        passage_text: null,
        audio_url: null,
        image_url: null,
        content: null,
        media: null,
        questions: extractQuestionsFromText(b.body, answerMap, 'FILL_IN_THE_BLANK'),
      })),
    };
  }

  if (skill === 'writing') {
    const task1 = text.match(/Task\s*1[\s\S]*?(?=Task\s*2|$)/i)?.[0]?.trim() || null;
    const task2 = text.match(/Task\s*2[\s\S]*$/i)?.[0]?.trim() || null;
    const sections = [];

    if (task1) {
      sections.push({
        section_no: 1,
        title: 'Task 1',
        passage_text: null,
        audio_url: null,
        image_url: null,
        content: { task_type: 'task1', question: task1.slice(0, 4000) },
        media: null,
        questions: [{ question_no: 1, question_type: 'WRITING_TASK', prompt: task1.slice(0, 4000), options: null, correct_answer: null, points: 150, metadata: {} }],
      });
    }
    if (task2) {
      sections.push({
        section_no: 2,
        title: 'Task 2',
        passage_text: null,
        audio_url: null,
        image_url: null,
        content: { task_type: 'task2', question: task2.slice(0, 4000) },
        media: null,
        questions: [{ question_no: 1, question_type: 'WRITING_TASK', prompt: task2.slice(0, 4000), options: null, correct_answer: null, points: 250, metadata: {} }],
      });
    }
    if (!sections.length) {
      sections.push({
        section_no: 1,
        title: 'Writing Task',
        passage_text: null,
        audio_url: null,
        image_url: null,
        content: { task_type: 'task', question: text.slice(0, 4000) },
        media: null,
        questions: [{ question_no: 1, question_type: 'WRITING_TASK', prompt: text.slice(0, 4000), options: null, correct_answer: null, points: 200, metadata: {} }],
      });
    }
    return { ...base, test_type: 'writing', duration_minutes: 60, sections };
  }

  const blocks = splitBlocksByHeader(text, /(Part\s+\d+|SPEAKING\s+PART\s+\d+)/gi);
  return {
    ...base,
    test_type: 'speaking',
    duration_minutes: 15,
    sections: blocks.map((b, idx) => ({
      section_no: idx + 1,
      title: b.title || `Part ${idx + 1}`,
      passage_text: null,
      audio_url: null,
      image_url: null,
      content: { topic: (b.body || '').slice(0, 200) || `Part ${idx + 1}` },
      media: null,
      questions: extractQuestionsFromText(b.body, answerMap, 'SPEAKING_PROMPT'),
    })),
  };
}

// ── Audio mapping ─────────────────────────────────────────────────────────────

/**
 * Parse audio filenames and group by test number.
 * Pattern: "Test N - Section M.mp3" or "Test N Section M.mp3"
 * Returns: { 1: { 1: Buffer, 2: Buffer, ... }, 2: { ... } }
 */
function mapAudioFiles(zipEntries) {
  const audioMap = {}; // testNo → { sectionNo → { name, buffer } }

  for (const entry of zipEntries) {
    const name = entry.entryName.replace(/.*\//, ''); // strip folder path
    // Match: "Test 1 - Section 2.mp3" or "Test1-Section2.mp3" etc.
    const m = name.match(/Test\s*(\d+)\s*[-–]?\s*Section\s*(\d+)/i);
    if (m) {
      const testNo = parseInt(m[1]);
      const sectionNo = parseInt(m[2]);
      if (!audioMap[testNo]) audioMap[testNo] = {};
      audioMap[testNo][sectionNo] = { name, buffer: entry.getData() };
    }
  }
  return audioMap;
}

// ── DB import ─────────────────────────────────────────────────────────────────

function makePublicId(code, sectionNo, questionNo) {
  return `${code}:s${String(sectionNo).padStart(2, '0')}:q${String(questionNo).padStart(3, '0')}`;
}

async function importTestJSON(testJSON) {
  const [test] = await Test.findOrCreate({
    where: { code: testJSON.code },
    defaults: {
      code: testJSON.code, name: testJSON.name, test_type: testJSON.test_type,
      level: testJSON.level || 'IELTS', duration_minutes: testJSON.duration_minutes || 60,
      source: 'pdf', pdf_parsed: true, is_active: true,
      tags: ['cambridge', 'practice'], metadata: testJSON.metadata || {},
    },
  });

  await test.update({
    name: testJSON.name, test_type: testJSON.test_type,
    level: testJSON.level || test.level, duration_minutes: testJSON.duration_minutes || test.duration_minutes,
    source: 'pdf', pdf_parsed: true, is_active: true, metadata: testJSON.metadata || test.metadata,
  });

  // Idempotent re-import
  await TestQuestion.destroy({ where: { test_id: test.id } });
  await TestSection.destroy({ where: { test_id: test.id } });

  for (const s of (testJSON.sections || [])) {
    const section = await TestSection.create({
      test_id: test.id, section_no: s.section_no, title: s.title || null,
      passage_text: s.passage_text || null, audio_url: s.audio_url || null,
      image_url: s.image_url || null, content: s.content || null,
      media: s.media || null, metadata: s.metadata || null,
    });

    for (const q of (s.questions || [])) {
      await TestQuestion.create({
        test_id: test.id, section_id: section.id,
        public_id: makePublicId(testJSON.code, s.section_no, q.question_no),
        question_no: q.question_no, question_type: q.question_type,
        prompt: q.prompt || null, options: q.options || null,
        correct_answer: q.correct_answer ?? null, points: q.points ?? 1,
        metadata: q.metadata || null,
      });
    }
  }

  return test.id;
}

// ── SSE progress helper ───────────────────────────────────────────────────────

function sendProgress(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Main controller ───────────────────────────────────────────────────────────

/**
 * POST /e-master/admin/import-book
 * multipart: file (ZIP), bookName, examType (IELTS|TOEIC), skills (comma-separated, default all)
 *
 * Uses SSE to stream progress back to client.
 */
exports.importBook = async (req, res) => {
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (type, payload) => sendProgress(res, { type, ...payload });

  try {
    const pdfFile = req.files?.pdf?.[0];
    const audioZipFile = req.files?.audioZip?.[0];

    if (!pdfFile) { send('error', { message: 'No PDF file uploaded' }); return res.end(); }

    const bookName = req.body.bookName || 'Cambridge IELTS';
    const examType = req.body.examType || 'IELTS';
    const requestedSkills = req.body.skills
      ? req.body.skills.split(',').map(s => s.trim().toLowerCase())
      : ['reading', 'listening', 'writing', 'speaking'];

    send('start', { message: `Processing "${bookName}"…` });

    // 1. Parse PDF
    send('progress', { step: 'pdf', message: 'Parsing PDF text…' });
    const pdfData = await pdfParse(pdfFile.buffer);
    const fullText = pdfData.text;
    send('progress', { step: 'pdf', message: `Extracted ${fullText.length} characters from PDF` });

    // 2. Extract audio from ZIP (if provided)
    let audioMap = {};
    if (audioZipFile) {
      send('progress', { step: 'audio', message: 'Extracting audio ZIP…' });
      const zip = new AdmZip(audioZipFile.buffer);
      const audioEntries = zip.getEntries().filter(e =>
        /\.(mp3|m4a|ogg|wav|aac)$/i.test(e.entryName) &&
        /Test\s*\d+\s*[-–]?\s*Section\s*\d+/i.test(e.entryName)
      );
      audioMap = mapAudioFiles(audioEntries);
      const testNos = Object.keys(audioMap).map(Number).sort((a, b) => a - b);
      send('progress', { step: 'audio', message: `Mapped audio for tests: ${testNos.join(', ') || 'none'} (${audioEntries.length} files)` });
    } else {
      send('progress', { step: 'audio', message: 'No audio ZIP provided — listening sections will have no audio_url' });
    }

    // 3. Split PDF by test
    const testChunks = splitByTest(fullText);
    const testsToProcess = testChunks || [{ testNo: 1, text: fullText }];
    send('progress', { step: 'split', message: `Detected ${testsToProcess.length} test(s) in PDF` });

    // 5. Process each test — associations already applied at server boot
    // DO NOT call applyTestV2Associations() here — it causes duplicate alias errors

    const results = [];
    let totalImported = 0;

    for (const { testNo, text: testText } of testsToProcess) {
      send('progress', { step: 'test', message: `Processing Test ${testNo}…`, testNo });

      const skillSections = splitBySkill(testText);
      const answerKeyText = skillSections.answerKey || '';

      for (const skill of requestedSkills) {
        const skillText = skillSections[skill] || (skill === 'reading' ? testText : null);
        if (!skillText || skillText.trim().length < 100) {
          send('progress', { step: 'skip', message: `Test ${testNo} ${skill}: no content found, skipping`, testNo, skill });
          continue;
        }

        const code = `${examType}-T${testNo}-${skill.toUpperCase().slice(0, 4)}`;
        const name = `${bookName} – Test ${testNo} – ${skill.charAt(0).toUpperCase() + skill.slice(1)}`;

        send('progress', {
          step: 'ai',
          message: NO_AI_IMPORT
            ? `Rule-based parsing Test ${testNo} ${skill} (NO_AI_IMPORT enabled)…`
            : `AI parsing Test ${testNo} ${skill}…`,
          testNo,
          skill
        });

        try {
          let parsed = null;
          if (NO_AI_IMPORT) {
            parsed = buildRuleBasedTestJSON(skill, skillText, code, name, answerKeyText);
          } else {
            const prompt = buildSkillPrompt(skill, skillText, code, name, answerKeyText);
            const raw = await callAI(prompt);
            parsed = extractJSON(raw);
          }

          if (!parsed) {
            send('progress', {
              step: 'warn',
              message: `Test ${testNo} ${skill}: parser returned no valid JSON`,
              testNo,
              skill
            });
            continue;
          }

          // Inject audio URLs for listening sections
          if (skill === 'listening' && audioMap[testNo]) {
            for (const section of (parsed.sections || [])) {
              const audioEntry = audioMap[testNo][section.section_no];
              if (audioEntry) {
                // Store audio filename in audio_url — in production this would be a CDN URL
                section.audio_url = `/audio/${bookName.replace(/\s+/g, '_')}/Test_${testNo}_Section_${section.section_no}.mp3`;
                section.media = { ...(section.media || {}), audio: section.audio_url, filename: audioEntry.name };
              }
            }
          }

          parsed.metadata = { ...(parsed.metadata || {}), book: bookName, exam_type: examType, test_no: testNo };

          send('progress', { step: 'import', message: `Importing Test ${testNo} ${skill} to DB…`, testNo, skill });
          const dbId = await importTestJSON(parsed);
          totalImported++;
          results.push({ testNo, skill, code, dbId, status: 'ok' });
          send('progress', { step: 'done_skill', message: `✅ Test ${testNo} ${skill} imported (id=${dbId})`, testNo, skill, dbId });

        } catch (err) {
          send('progress', { step: 'error_skill', message: `❌ Test ${testNo} ${skill}: ${err.message}`, testNo, skill });
          results.push({ testNo, skill, code, status: 'error', error: err.message });
        }

        // Throttle AI calls
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    send('done', {
      message: `Import complete: ${totalImported} tests imported`,
      totalImported,
      results,
    });

  } catch (err) {
    console.error('[bookImport]', err.message);
    send('error', { message: err.message });
  }

  res.end();
};
