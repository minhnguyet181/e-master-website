#!/usr/bin/env node
/**
 * Import generated tests v2 JSON into database.
 *
 * Input folder (default): <repoRoot>/generated-tests-v2
 * Usage (from Back-end/):
 *   node scripts/import-tests-v2.js
 *   TESTS_V2_DIR=/abs/path/to/generated-tests-v2 node scripts/import-tests-v2.js
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

async function upsertTestFromFile(testFilePath, catalogItem) {
  const t = readJson(testFilePath);
  const code = t.code || catalogItem.code;
  const name = t.name || catalogItem.name;
  const testType = t.test_type || catalogItem.test_type;

  const [test] = await Test.findOrCreate({
    where: { code },
    defaults: {
      code,
      name,
      test_type: testType,
      level: t.level || catalogItem.level || 'IELTS',
      duration_minutes: t.duration_minutes || catalogItem.duration_minutes || 60,
      source: catalogItem.source || 'static',
      is_active: true,
      tags: catalogItem.tags || ['practice'],
      metadata: t.metadata || {},
      description: null,
    },
  });

  // If exists, update basic fields
  await test.update({
    name,
    test_type: testType,
    level: t.level || test.level,
    duration_minutes: t.duration_minutes || test.duration_minutes,
    source: catalogItem.source || test.source,
    tags: catalogItem.tags || test.tags,
    metadata: t.metadata || test.metadata,
    is_active: true,
  });

  // Import sections/questions (idempotency: delete and re-insert per test)
  await TestQuestion.destroy({ where: { test_id: test.id } });
  await TestSection.destroy({ where: { test_id: test.id } });

  const sections = Array.isArray(t.sections) ? t.sections : [];
  for (const s of sections) {
    const section = await TestSection.create({
      test_id: test.id,
      section_no: s.section_no,
      title: s.title || null,
      content: s.content || null,
      media: s.media || null,
      metadata: s.metadata || null,
    });

    const questions = Array.isArray(s.questions) ? s.questions : [];
    for (const q of questions) {
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

  // Also support top-level questions (optional)
  if (Array.isArray(t.questions) && t.questions.length > 0) {
    for (const q of t.questions) {
      await TestQuestion.create({
        test_id: test.id,
        section_id: null,
        public_id: q.public_id || makePublicId(code, 0, q.question_no),
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
    console.error('Cannot find catalog.json at:', catalogPath);
    process.exit(1);
  }

  const catalog = readJson(catalogPath);
  const items = catalog.tests || [];

  console.log(`🚀 Importing ${items.length} tests from ${dir}`);
  await sequelize.authenticate();

  for (const item of items) {
    const testFilePath = path.join(dir, item.file);
    if (!fs.existsSync(testFilePath)) {
      console.warn('Skip missing test file:', testFilePath);
      continue;
    }
    const test = await upsertTestFromFile(testFilePath, item);
    console.log(`✅ Imported: ${test.code} (id=${test.id})`);
  }

  console.log('✅ Import completed');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});

