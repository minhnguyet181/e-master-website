#!/usr/bin/env node
/**
 * pdf-to-test.js
 * Parse a PDF file into the tests-v2 JSON format using AI (Gemini).
 *
 * Usage (from Back-end/):
 *   node scripts/pdf-to-test.js --pdf "../ETEST IELTS READING TEST 2.pdf" --skill reading
 *   node scripts/pdf-to-test.js --pdf "path/to/file.pdf" --skill reading --out output.json --code IELTS-READ-010
 *
 * Options:
 *   --pdf    Path to PDF file (required)
 *   --skill  reading | listening | writing | speaking (required)
 *   --out    Output JSON path (default: auto-generated in generated-tests-v2/tests/)
 *   --code   Test code override (default: auto-generated)
 *   --name   Test name override (default: derived from filename)
 *   --dry    Dry run: print JSON to stdout, don't write file
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');

// ── helpers ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      opts[key] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    }
  }
  return opts;
}

function normalizeGeminiKey(raw) {
  if (!raw) return '';
  let k = String(raw).trim();
  if (k.charCodeAt(0) === 0xfeff) k = k.slice(1).trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1).trim();
  if (k.startsWith('yAIza')) k = k.slice(1);
  return k.trim();
}

function extractJSON(text) {
  // Try ```json ... ``` block first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  // Fallback: find outermost { }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return null;
}

async function callGemini(prompt, maxTokens = 8192) {
  const key = normalizeGeminiKey(process.env.GEMINI_API_KEY);
  if (!key) throw new Error('GEMINI_API_KEY not set in .env');
  const model = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.post(url, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens, topP: 0.95 },
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });

      if (res.data.error) throw new Error(res.data.error.message);
      return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      const status = err.response?.status;
      if ((status === 503 || status === 429) && attempt < 3) {
        const wait = attempt * 15000;
        console.warn(`  ⚠️  Gemini ${status}, retry ${attempt}/3 in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else throw err;
    }
  }
}

async function callOpenAI(prompt, maxTokens = 8192) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set in .env');
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const url = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

  const res = await axios.post(url, {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: maxTokens,
  }, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, timeout: 120000 });

  return res.data?.choices?.[0]?.message?.content || '';
}

async function callAI(prompt, maxTokens = 8192, provider = 'gemini') {
  if (provider === 'openai') return callOpenAI(prompt, maxTokens);
  try {
    return await callGemini(prompt, maxTokens);
  } catch (err) {
    // Fallback to OpenAI if Gemini fails and key is available
    if (process.env.OPENAI_API_KEY) {
      console.warn('  ⚠️  Gemini failed, falling back to OpenAI...');
      return callOpenAI(prompt, maxTokens);
    }
    throw err;
  }
}

function makeCode(skill, existingCodes = []) {
  const prefix = `IELTS-${skill.toUpperCase().slice(0, 4)}-`;
  const nums = existingCodes
    .filter(c => c.startsWith(prefix))
    .map(c => parseInt(c.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function getExistingCodes() {
  const catalogPath = path.join(__dirname, '../../generated-tests-v2/catalog.json');
  if (!fs.existsSync(catalogPath)) return [];
  try {
    const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    return (cat.tests || []).map(t => t.code);
  } catch { return []; }
}

// ── prompts per skill ─────────────────────────────────────────────────────────

function buildPrompt(skill, pdfText, testCode, testName) {
  const baseInstruction = `You are an IELTS test data extractor. Extract the test content from the PDF text below and return ONLY valid JSON matching the exact schema shown. No explanation, no markdown prose outside the JSON block.`;

  const schema = {
    reading: `{
  "code": "${testCode}",
  "name": "${testName}",
  "test_type": "reading",
  "duration_minutes": 60,
  "level": "IELTS",
  "sections": [
    {
      "section_no": 1,
      "title": "Passage 1 – <title>",
      "passage_text": "<full passage text>",
      "audio_url": null,
      "image_url": null,
      "content": { "passageTitle": "<title>", "passageText": "<full passage text>" },
      "media": null,
      "questions": [
        {
          "question_no": 1,
          "question_type": "TRUE_FALSE_NOT_GIVEN | MULTIPLE_CHOICE | FILL_IN_THE_BLANK | MATCHING | SUMMARY_COMPLETION | TABLE_COMPLETION | SENTENCE_COMPLETION | SHORT_ANSWER",
          "prompt": "<question text>",
          "options": ["TRUE","FALSE","NOT GIVEN"] ,
          "correct_answer": "<answer>",
          "points": 1,
          "metadata": {}
        }
      ]
    }
  ],
  "metadata": {}
}

Rules:
- Include ALL passages as separate sections (section_no: 1, 2, 3).
- Include ALL questions with correct answers.
- For TRUE/FALSE/NOT GIVEN: options must be ["TRUE","FALSE","NOT GIVEN"].
- For MULTIPLE_CHOICE: options must be the actual answer choices from the PDF.
- For fill-in-blank types: options is null, correct_answer is the word/phrase.
- question_type must be one of the listed enum values (uppercase with underscores).`,

    listening: `{
  "code": "${testCode}",
  "name": "${testName}",
  "test_type": "listening",
  "duration_minutes": 30,
  "level": "IELTS",
  "sections": [
    {
      "section_no": 1,
      "title": "Section 1",
      "passage_text": null,
      "audio_url": null,
      "image_url": null,
      "content": null,
      "media": null,
      "questions": [
        {
          "question_no": 1,
          "question_type": "FILL_IN_THE_BLANK | MULTIPLE_CHOICE | TABLE_COMPLETION | MAP_LABELLING | MATCHING",
          "prompt": "<question text>",
          "options": null,
          "correct_answer": "<answer>",
          "points": 1,
          "metadata": {}
        }
      ]
    }
  ],
  "metadata": {}
}

Rules:
- Extract all 4 sections if present.
- Include all questions with correct answers from the answer key.`,

    writing: `{
  "code": "${testCode}",
  "name": "${testName}",
  "test_type": "writing",
  "duration_minutes": 60,
  "level": "IELTS",
  "sections": [
    {
      "section_no": 1,
      "title": "Task 1",
      "passage_text": null,
      "audio_url": null,
      "image_url": null,
      "prompt": "<task 1 question>",
      "content": { "task_type": "task1", "question": "<task 1 question>" },
      "media": null,
      "questions": [{ "question_no": 1, "question_type": "WRITING_TASK", "prompt": "<task 1 question>", "options": null, "correct_answer": null, "points": 150, "metadata": {} }]
    },
    {
      "section_no": 2,
      "title": "Task 2",
      "passage_text": null,
      "audio_url": null,
      "image_url": null,
      "prompt": "<task 2 question>",
      "content": { "task_type": "task2", "question": "<task 2 question>" },
      "media": null,
      "questions": [{ "question_no": 1, "question_type": "WRITING_TASK", "prompt": "<task 2 question>", "options": null, "correct_answer": null, "points": 250, "metadata": {} }]
    }
  ],
  "metadata": {}
}`,

    speaking: `{
  "code": "${testCode}",
  "name": "${testName}",
  "test_type": "speaking",
  "duration_minutes": 15,
  "level": "IELTS",
  "sections": [
    {
      "section_no": 1,
      "title": "Part 1",
      "passage_text": null,
      "audio_url": null,
      "image_url": null,
      "prompt": "<topic>",
      "content": { "topic": "<topic>" },
      "media": null,
      "questions": [
        { "question_no": 1, "question_type": "SPEAKING_PROMPT", "prompt": "<question>", "options": null, "correct_answer": null, "points": 0, "metadata": {} }
      ]
    }
  ],
  "metadata": {}
}`,
  };

  return `${baseInstruction}

Return the JSON wrapped in a \`\`\`json ... \`\`\` code block.

TARGET SCHEMA:
\`\`\`json
${schema[skill] || schema.reading}
\`\`\`

PDF TEXT:
---
${pdfText.slice(0, 28000)}
---`;
}

// ── chunk processing for long PDFs ───────────────────────────────────────────

/**
 * For reading tests with multiple passages, split by passage and process each.
 * Returns merged sections array.
 */
async function processReadingInChunks(pdfText, testCode, testName) {
  // Heuristic: split on "Passage" or "PASSAGE" or "Reading Passage"
  const passageSplitRe = /(?=(?:Reading\s+)?Passage\s+[123]|PASSAGE\s+[123])/i;
  const chunks = pdfText.split(passageSplitRe).filter(c => c.trim().length > 100);

  if (chunks.length <= 1) {
    // Single chunk, process normally
    return null;
  }

  console.log(`  📄 Detected ${chunks.length} passage chunks, processing separately...`);
  const allSections = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkCode = `${testCode}-chunk${i + 1}`;
    const prompt = buildPrompt('reading', chunks[i], chunkCode, testName);
    console.log(`  🔄 Processing passage ${i + 1}/${chunks.length}...`);
    const raw = await callAI(prompt, 8192);
    const parsed = extractJSON(raw);
    if (parsed && parsed.sections) {
      parsed.sections.forEach((s, idx) => {
        s.section_no = allSections.length + idx + 1;
        allSections.push(s);
      });
    } else {
      console.warn(`  ⚠️  Could not parse passage ${i + 1}, skipping.`);
    }
    // Small delay between calls
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  return allSections.length ? allSections : null;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (!opts.pdf || !opts.skill) {
    console.error('Usage: node scripts/pdf-to-test.js --pdf <path> --skill <reading|listening|writing|speaking> [--out <path>] [--code <code>] [--name <name>] [--provider gemini|openai] [--dry]');
    process.exit(1);
  }

  const skill = opts.skill.toLowerCase();
  if (!['reading', 'listening', 'writing', 'speaking'].includes(skill)) {
    console.error('--skill must be one of: reading, listening, writing, speaking');
    process.exit(1);
  }

  const pdfPath = path.resolve(opts.pdf);
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found:', pdfPath);
    process.exit(1);
  }

  // Auto-generate code and name
  const existingCodes = getExistingCodes();
  const testCode = opts.code || makeCode(skill, existingCodes);
  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const testName = opts.name || baseName;

  console.log(`\n📖 Reading PDF: ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text;
  console.log(`  ✅ Extracted ${pdfText.length} characters`);
  console.log(`  Preview: ${pdfText.slice(0, 200).replace(/\n/g, ' ')}`);

  // Try chunked processing for reading (multiple passages)
  let result = null;

  if (skill === 'reading' && pdfText.length > 8000) {
    const chunkedSections = await processReadingInChunks(pdfText, testCode, testName);
    if (chunkedSections) {
      result = {
        code: testCode,
        name: testName,
        test_type: 'reading',
        duration_minutes: 60,
        level: 'IELTS',
        sections: chunkedSections,
        metadata: { source_file: path.basename(pdfPath) },
      };
    }
  }

  if (!result) {
    console.log(`\n🤖 Calling AI to parse ${skill} test...`);
    const prompt = buildPrompt(skill, pdfText, testCode, testName);
    const raw = await callAI(prompt, 8192, opts.provider || 'gemini');
    result = extractJSON(raw);

    if (!result) {
      console.error('❌ Could not extract valid JSON from AI response.');
      console.error('Raw response:\n', raw.slice(0, 2000));
      process.exit(1);
    }
  }

  // Ensure required fields
  result.code = result.code || testCode;
  result.name = result.name || testName;
  result.test_type = result.test_type || skill;
  result.metadata = result.metadata || {};
  result.metadata.source_file = path.basename(pdfPath);

  const totalQuestions = (result.sections || []).reduce((sum, s) => sum + (s.questions || []).length, 0);
  console.log(`\n✅ Parsed: ${result.sections?.length || 0} section(s), ${totalQuestions} question(s)`);

  if (opts.dry) {
    console.log('\n--- JSON OUTPUT ---');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Write output
  let outPath = opts.out;
  if (!outPath) {
    const outDir = path.join(__dirname, '../../generated-tests-v2/tests');
    fs.mkdirSync(outDir, { recursive: true });
    outPath = path.join(outDir, `${testCode}.json`);
  }
  outPath = path.resolve(outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n💾 Saved to: ${outPath}`);
  console.log(`\nNext step: node scripts/pdf-import.js --file "${outPath}"`);
}

main().catch(err => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
