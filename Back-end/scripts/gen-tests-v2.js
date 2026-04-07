#!/usr/bin/env node
/**
 * Generate "tests v2" JSON format from Front-end/public/data/tests.json + files.
 *
 * Each JSON file = 1 test (1 section for reading/listening).
 * Reading: passage stored in section.passage_text (object or string)
 * Listening: audio stored in section.audio_url
 *
 * Usage (from Back-end/):
 *  node scripts/gen-tests-v2.js
 */

const fs = require('fs');
const path = require('path');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}
function makeCode(skill, idx) {
  return `IELTS-${skill.toUpperCase()}-${String(idx).padStart(3, '0')}`;
}

function normalizeListening(fileJson, code, name) {
  const sectionNo = fileJson.sectionNumber || 1;
  // audio path relative to /data/
  const audioUrl = fileJson.audio ? `/data/${fileJson.audio}` : null;
  const imageUrl = fileJson.image ? `/data/${fileJson.image}` : null;

  return {
    code,
    name,
    test_type: 'listening',
    duration_minutes: 30,
    level: 'IELTS',
    sections: [
      {
        section_no: sectionNo,
        title: fileJson.sectionTitle || `Section ${sectionNo}`,
        // Store audio/image directly on section for easy access
        audio_url: audioUrl,
        image_url: imageUrl,
        passage_text: null,
        content: null,
        media: { audio: audioUrl, image: imageUrl },
        questions: (fileJson.questions || []).map((q) => ({
          question_no: q.questionNumber,
          question_type: q.questionType || 'TABLE_COMPLETION',
          prompt: q.questionText || null,
          options: q.options || null,
          correct_answer: q.correctAnswer ?? null,
          points: q.points ?? 1,
          metadata: {},
        })),
      },
    ],
    metadata: {},
  };
}

function normalizeReading(fileJson, code, name) {
  // passageText can be object {A: "...", B: "..."} or plain string
  const passageText = fileJson.passageText || null;

  return {
    code,
    name,
    test_type: 'reading',
    duration_minutes: 60,
    level: 'IELTS',
    sections: [
      {
        section_no: 1,
        title: fileJson.section || 'Reading Passage',
        // Store passage directly on section
        passage_text: typeof passageText === 'object' ? JSON.stringify(passageText) : passageText,
        audio_url: null,
        image_url: null,
        content: {
          passageTitle: fileJson.passageTitle || null,
          // Keep object form for FE rendering
          passageText: passageText,
        },
        media: null,
        questions: (fileJson.questions || []).map((q) => ({
          question_no: q.questionNumber,
          question_type: q.questionType || 'UNKNOWN',
          prompt: q.questionText || null,
          options: q.options || null,
          correct_answer: q.correctAnswer ?? null,
          points: q.points ?? 1,
          metadata: {},
        })),
      },
    ],
    metadata: {},
  };
}

function normalizeWriting(fileJson, code, name) {
  const taskType = fileJson.task_type || fileJson.taskType || 'task2';
  const isTask1 = /task\s*1/i.test(taskType);
  const minWords = isTask1 ? 150 : 250;
  return {
    code,
    name,
    test_type: 'writing',
    task_type: taskType,
    duration_minutes: isTask1 ? 20 : 40,
    level: 'IELTS',
    sections: [
      {
        section_no: 1,
        title: taskType,
        passage_text: null,
        audio_url: null,
        image_url: fileJson.media || null,
        prompt: fileJson.question || null,
        content: {
          task_type: taskType,
          title: fileJson.title || null,
          question: fileJson.question || null,
        },
        media: { image: fileJson.media || null },
        questions: [
          {
            question_no: 1,
            question_type: 'WRITING_TASK',
            prompt: fileJson.question || `Write at least ${minWords} words.`,
            options: null,
            correct_answer: null,
            points: minWords,
            metadata: { band_rubric: 'ielts_writing_v1', sample_answer: fileJson.sample_answer || null },
          },
        ],
      },
    ],
    metadata: {},
  };
}

function normalizeSpeaking(fileJson, code, name) {
  const part = fileJson.part || 'Speaking Part 1';
  const topic = fileJson.topic || null;
  return {
    code,
    name,
    test_type: 'speaking',
    duration_minutes: 15,
    level: 'IELTS',
    sections: [
      {
        section_no: 1,
        title: part,
        passage_text: null,
        audio_url: null,
        image_url: null,
        prompt: topic,
        content: { topic },
        media: null,
        questions: (fileJson.questions || []).map((p, i) => ({
          question_no: i + 1,
          question_type: 'SPEAKING_PROMPT',
          prompt: typeof p === 'string' ? p : p.question || p.prompt || '',
          options: null,
          correct_answer: null,
          points: 0,
          metadata: { topic, part },
        })),
      },
    ],
    metadata: {},
  };
}

function main() {
  const backendDir = process.cwd();
  const repoRoot = path.resolve(backendDir, '..');
  const dataRoot = path.join(repoRoot, 'Front-end', 'public', 'data');
  const catalogPath = path.join(dataRoot, 'tests.json');

  if (!fs.existsSync(catalogPath)) {
    console.error('Cannot find tests.json at:', catalogPath);
    process.exit(1);
  }

  const catalog = readJson(catalogPath);
  const outDir = path.join(repoRoot, 'generated-tests-v2');
  const outCatalog = { version: 2, generated_from: 'Front-end/public/data', tests: [] };

  for (const skill of Object.keys(catalog)) {
    const list = catalog[skill] || [];
    list.forEach((item, idx) => {
      const code = makeCode(skill, idx + 1);
      const name = item.name || `${skill} test ${idx + 1}`;
      const srcFile = path.join(dataRoot, item.file);
      if (!fs.existsSync(srcFile)) {
        console.warn('Skip missing file:', srcFile);
        return;
      }
      const fileJson = readJson(srcFile);

      let normalized;
      if (skill === 'listening') normalized = normalizeListening(fileJson, code, name);
      else if (skill === 'reading') normalized = normalizeReading(fileJson, code, name);
      else if (skill === 'writing') normalized = normalizeWriting(fileJson, code, name);
      else if (skill === 'speaking') normalized = normalizeSpeaking(fileJson, code, name);
      else return;

      const outFile = `tests/${code}.json`;
      writeJson(path.join(outDir, outFile), normalized);

      outCatalog.tests.push({
        code,
        name,
        test_type: normalized.test_type,
        task_type: normalized.task_type || null,
        level: normalized.level || 'IELTS',
        duration_minutes: normalized.duration_minutes || 60,
        source: 'static',
        file: outFile,
        tags: ['practice'],
      });
    });
  }

  writeJson(path.join(outDir, 'catalog.json'), outCatalog);
  console.log(`✅ Generated ${outCatalog.tests.length} tests at: ${outDir}`);
}

main();
