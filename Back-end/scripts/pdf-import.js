#!/usr/bin/env node
/**
 * pdf-import.js
 * Import a single test JSON file (output of pdf-to-test.js) into the database.
 *
 * Usage (from Back-end/):
 *   node scripts/pdf-import.js --file "../generated-tests-v2/tests/IELTS-READ-010.json"
 *   node scripts/pdf-import.js --dir "../generated-tests-v2/tests"   # import all JSON in dir
 *
 * Options:
 *   --file   Path to a single JSON test file
 *   --dir    Path to a directory of JSON test files (imports all *.json)
 *   --dry    Dry run: validate JSON and print summary without writing to DB
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const sequelize = require('../src/config/db');
const Test = require('../src/models/test.model');
const TestSection = require('../src/models/testSection.model');
const TestQuestion = require('../src/models/testQuestion.model');
const { applyTestV2Associations } = require('../src/models/testV2.associations');

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

function makePublicId(code, sectionNo, questionNo) {
  return `${code}:s${String(sectionNo).padStart(2, '0')}:q${String(questionNo).padStart(3, '0')}`;
}

function validateTestJSON(t, filePath) {
  const errors = [];
  if (!t.code) errors.push('Missing: code');
  if (!t.name) errors.push('Missing: name');
  if (!t.test_type) errors.push('Missing: test_type');
  if (!Array.isArray(t.sections) || t.sections.length === 0) errors.push('Missing: sections[]');
  else {
    t.sections.forEach((s, i) => {
      if (!s.section_no) errors.push(`sections[${i}]: missing section_no`);
      if (!Array.isArray(s.questions)) errors.push(`sections[${i}]: missing questions[]`);
    });
  }
  if (errors.length) {
    console.error(`❌ Validation failed for ${path.basename(filePath)}:`);
    errors.forEach(e => console.error(`   - ${e}`));
    return false;
  }
  return true;
}

async function importTestFile(filePath, dry = false) {
  const t = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!validateTestJSON(t, filePath)) return false;

  const totalQ = t.sections.reduce((sum, s) => sum + (s.questions || []).length, 0);
  console.log(`  📋 ${t.code} | ${t.test_type} | ${t.sections.length} section(s) | ${totalQ} question(s)`);

  if (dry) {
    console.log(`  ✅ [dry] Would import: ${t.code}`);
    return true;
  }

  const [test] = await Test.findOrCreate({
    where: { code: t.code },
    defaults: {
      code: t.code,
      name: t.name,
      test_type: t.test_type,
      task_type: t.task_type || null,
      level: t.level || 'IELTS',
      duration_minutes: t.duration_minutes || 60,
      source: 'pdf',
      pdf_parsed: true,
      is_active: true,
      tags: t.tags || ['practice'],
      metadata: t.metadata || {},
    },
  });

  await test.update({
    name: t.name,
    test_type: t.test_type,
    task_type: t.task_type || null,
    level: t.level || test.level,
    duration_minutes: t.duration_minutes || test.duration_minutes,
    source: 'pdf',
    pdf_parsed: true,
    tags: t.tags || test.tags,
    metadata: t.metadata || test.metadata,
    is_active: true,
  });

  // Idempotent: delete and re-insert sections/questions
  await TestQuestion.destroy({ where: { test_id: test.id } });
  await TestSection.destroy({ where: { test_id: test.id } });

  for (const s of t.sections) {
    const section = await TestSection.create({
      test_id: test.id,
      section_no: s.section_no,
      title: s.title || null,
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
        public_id: makePublicId(t.code, s.section_no, q.question_no),
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

  console.log(`  ✅ Imported: ${t.code} (id=${test.id})`);
  return true;
}

async function main() {
  const opts = parseArgs();
  const dry = !!opts.dry;

  if (!opts.file && !opts.dir) {
    console.error('Usage: node scripts/pdf-import.js --file <path.json> | --dir <directory>');
    process.exit(1);
  }

  let files = [];

  if (opts.file) {
    const p = path.resolve(opts.file);
    if (!fs.existsSync(p)) { console.error('File not found:', p); process.exit(1); }
    files = [p];
  } else if (opts.dir) {
    const d = path.resolve(opts.dir);
    if (!fs.existsSync(d)) { console.error('Directory not found:', d); process.exit(1); }
    files = fs.readdirSync(d).filter(f => f.endsWith('.json')).map(f => path.join(d, f));
    if (!files.length) { console.error('No JSON files found in:', d); process.exit(1); }
  }

  console.log(`\n🚀 Importing ${files.length} file(s)${dry ? ' [DRY RUN]' : ''}...\n`);

  if (!dry) {
    applyTestV2Associations();
    await sequelize.authenticate();
  }

  let ok = 0, fail = 0;
  for (const f of files) {
    console.log(`\n📂 ${path.basename(f)}`);
    try {
      const success = await importTestFile(f, dry);
      success ? ok++ : fail++;
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n✅ Done: ${ok} imported, ${fail} failed`);
  if (!dry) process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message || err);
  process.exit(1);
});
