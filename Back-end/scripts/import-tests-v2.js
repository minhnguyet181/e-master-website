#!/usr/bin/env node
/**
 * Import generated tests v2 JSON into database.
 *
 * Usage (from Back-end/):
 *   node scripts/import-tests-v2.js
 *   TESTS_V2_DIR=/abs/path node scripts/import-tests-v2.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const sequelize = require('../src/config/db');
const Test = require('../src/models/test.model');
const TestSection = require('../src/models/testSection.model');
const TestQuestion = require('../src/models/testQuestion.model');
const { applyTestV2Associations } = require('../src/models/testV2.associations');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function makePublicId(code, sectionNo, questionNo) {
  return `${code}:s${String(sectionNo).padStart(2, '0')}:q${String(questionNo).padStart(3, '0')}`;
}

async function upsertTest(testFilePath, catalogItem) {
  const t = readJson(testFilePath);
  const code = t.code || catalogItem.code;

  const [test] = await Test.findOrCreate({
    where: { code },
    defaults: {
      code,
      name: t.name || catalogItem.name,
      test_type: t.test_type || catalogItem.test_type,
      task_type: t.task_type || catalogItem.task_type || null,
      level: t.level || catalogItem.level || 'IELTS',
      duration_minutes: t.duration_minutes || catalogItem.duration_minutes || 60,
      source: catalogItem.source || 'static',
      is_active: true,
      tags: catalogItem.tags || ['practice'],
      metadata: t.metadata || {},
    },
  });

  await test.update({
    name: t.name || catalogItem.name,
    test_type: t.test_type || catalogItem.test_type,
    task_type: t.task_type || catalogItem.task_type || null,
    level: t.level || test.level,
    duration_minutes: t.duration_minutes || test.duration_minutes,
    tags: catalogItem.tags || test.tags,
    metadata: t.metadata || test.metadata,
    is_active: true,
  });

  // Idempotent: delete and re-insert
  await TestQuestion.destroy({ where: { test_id: test.id } });
  await TestSection.destroy({ where: { test_id: test.id } });

  for (const s of (t.sections || [])) {
    const section = await TestSection.create({
      test_id: test.id,
      section_no: s.section_no,
      title: s.title || null,
      // Store passage text and media URLs directly
      passage_text: s.passage_text || null,
      audio_url: s.audio_url || s.media?.audio || null,
      image_url: s.image_url || s.media?.image || null,
      prompt: s.prompt || null,
      content: s.content || null,
      media: s.media || null,
      metadata: s.metadata || null,
    });

    for (const q of (s.questions || [])) {
      await TestQuestion.create({
        test_id: test.id,
        section_id: section.id,
        public_id: makePublicId(code, s.section_no, q.question_no),
        question_no: q.question_no,
        question_type: q.question_type,
        prompt: q.prompt || null,
        options: q.options || null,
        correct_answer: q.correct_answer ?? null,
        points: q.points ?? 1,
        metadata: q.metadata || null,
      });
    }
  }

  return test;
}

async function main() {
  applyTestV2Associations();

  const backendDir = process.cwd();
  const repoRoot = path.resolve(backendDir, '..');
  const dir = process.env.TESTS_V2_DIR || path.join(repoRoot, 'generated-tests-v2');
  const catalogPath = path.join(dir, 'catalog.json');

  if (!fs.existsSync(catalogPath)) {
    console.error('catalog.json not found at:', catalogPath);
    console.error('Run: node scripts/gen-tests-v2.js first');
    process.exit(1);
  }

  const catalog = readJson(catalogPath);
  const items = catalog.tests || [];

  console.log(`🚀 Importing ${items.length} tests...`);
  await sequelize.authenticate();

  let ok = 0, skip = 0;
  for (const item of items) {
    const filePath = path.join(dir, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn('⚠️  Skip missing file:', filePath);
      skip++;
      continue;
    }
    const test = await upsertTest(filePath, item);
    console.log(`  ✅ ${test.code} (id=${test.id})`);
    ok++;
  }

  console.log(`\n✅ Done: ${ok} imported, ${skip} skipped`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
