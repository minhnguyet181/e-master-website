#!/usr/bin/env node
/**
 * Generate "tests v2" JSON format from current Front-end/public/data/tests.json + files.
 *
 * Output:
 *  - generated-tests-v2/catalog.json
 *  - generated-tests-v2/tests/<CODE>.json
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
  // current listening file: {sectionNumber, sectionTitle, audio, image, questions:[{questionNumber,questionType,questionText,correctAnswer}]}
  const sectionNo = fileJson.sectionNumber || 1;
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
        media: { audio: fileJson.audio || null, image: fileJson.image || null },
        content: null,
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

function normalizeReading(fileJson, code, name) {
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
        media: null,
        content: {
          passageTitle: fileJson.passageTitle || null,
          passageText: fileJson.passageText || null,
        },
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
  const taskType = fileJson.task_type || fileJson.taskType || 'Writing';
  const minWords = /task\s*1/i.test(taskType) ? 150 : 250;
  return {
    code,
    name,
    test_type: 'writing',
    duration_minutes: /task\s*1/i.test(taskType) ? 20 : 40,
    level: 'IELTS',
    sections: [
      {
        section_no: 1,
        title: taskType,
        media: { image: fileJson.media || null },
        content: {
          task_type: taskType,
          title: fileJson.title || null,
          question: fileJson.question || null,
        },
        questions: [
          {
            question_no: 1,
            question_type: 'WRITING_TASK',
            prompt: fileJson.question || `Write at least ${minWords} words.`,
            options: null,
            correct_answer: null,
            points: minWords,
            metadata: { band_rubric: 'ielts_writing_v1' },
          },
        ],
      },
    ],
    metadata: {},
  };
}

function normalizeSpeaking(fileJson, code, name) {
  const part = fileJson.part || 'Speaking';
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
        media: null,
        content: { topic },
        questions: (fileJson.questions || []).map((p, i) => ({
          question_no: i + 1,
          question_type: 'SPEAKING_PROMPT',
          prompt: p,
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
        level: normalized.level || 'IELTS',
        duration_minutes: normalized.duration_minutes || 60,
        source: 'static',
        file: outFile,
        tags: ['practice'],
      });
    });
  }

  writeJson(path.join(outDir, 'catalog.json'), outCatalog);
  console.log('✅ Generated tests v2 at:', outDir);
}

main();

