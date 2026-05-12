#!/usr/bin/env node
/**
 * resource-import.js
 * Import Resource JSON files into the database (resources table).
 *
 * Usage (from Back-end/):
 *   node scripts/resource-import.js --file "../generated-resources/my-resource.json"
 *   node scripts/resource-import.js --dir "../generated-resources"   # import all *.json in dir
 *
 * Options:
 *   --file   Path to a single Resource JSON file
 *   --dir    Path to a directory of Resource JSON files (imports all *.json)
 *   --dry    Dry run: validate JSON and print summary without writing to DB
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const sequelize = require('../src/config/db');
const Resource = require('../src/models/resource.model');
const { validateResourceJSON } = require('../src/utils/resource-schema');
const { sanitizeBilingualContent, stripEmbeddedPromoFooters } = require('../src/utils/strip-resource-promo');

// ─── Pure helper functions (exported for testing) ────────────────────────────

/**
 * Parse CLI arguments into an options object.
 * @returns {{ file?: string, dir?: string, dry?: boolean }}
 */
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

/**
 * Generate auto-summary from content.en (max 500 chars).
 * @param {string|null|undefined} summary - existing summary
 * @param {object} content - bilingual content object { en, vi }
 * @returns {string|null}
 */
function buildSummary(summary, content) {
  if (summary != null) return summary;
  if (content && typeof content.en === 'string' && content.en.length > 0) {
    return content.en.slice(0, 500);
  }
  return null;
}

/**
 * Build the composite upsert key from a resource JSON object.
 * @param {object} r - resource JSON
 * @returns {{ title: string, resource_type: string, skill: string }}
 */
function buildCompositeKey(r) {
  const taxonomy = r.taxonomy || {};
  return {
    title: r.title,
    resource_type: taxonomy.resource_type || r.resource_type || '',
    skill: taxonomy.skill || r.skill || '',
  };
}

/**
 * Map a Resource_JSON object to a DB record object.
 * @param {object} r - validated resource JSON
 * @returns {object} DB record fields
 */
function buildDbRecord(r) {
  const taxonomy = r.taxonomy || {};

  let contentField = r.content;
  if (contentField && typeof contentField === 'object') {
    contentField = sanitizeBilingualContent(contentField);
  } else if (typeof contentField === 'string') {
    contentField = stripEmbeddedPromoFooters(contentField);
  }

  const summary = buildSummary(r.summary, typeof contentField === 'object' ? contentField : r.content);

  return {
    title: r.title,
    content: typeof contentField === 'object' ? JSON.stringify(contentField) : contentField,
    summary,
    resource_type: taxonomy.resource_type || r.resource_type || null,
    skill: taxonomy.skill || r.skill || null,
    level: taxonomy.level || r.level || null,
    tags: taxonomy.tags || r.tags || null,
    keywords: taxonomy.keywords || r.keywords || null,
    exam_type: taxonomy.exam_type || r.exam_type || null,
    topic: taxonomy.topic || r.topic || null,
    metadata: r.metadata || null,
    is_active: true,
  };
}

// ─── Import logic ─────────────────────────────────────────────────────────────

/**
 * Import a single resource JSON file into the DB.
 * @param {string} filePath
 * @param {boolean} dry
 * @returns {{ success: boolean, action?: 'created'|'updated' }}
 */
async function importResourceFile(filePath, dry = false) {
  // 1. Parse JSON
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`  ❌ JSON parse error in ${path.basename(filePath)}: ${err.message}`);
    return { success: false };
  }

  // 2. Validate schema
  const validation = validateResourceJSON(raw);
  if (!validation.valid) {
    console.error(`  ❌ Validation failed for ${path.basename(filePath)}:`);
    validation.errors.forEach(e => console.error(`     - ${e}`));
    return { success: false };
  }

  const record = buildDbRecord(raw);
  const compositeKey = buildCompositeKey(raw);

  console.log(`  📋 "${record.title}" | ${record.resource_type} | ${record.skill}`);

  if (dry) {
    console.log(`  ✅ [dry] Would upsert: "${record.title}"`);
    return { success: true, action: 'created' };
  }

  // 3. Upsert using composite key
  const [resource, created] = await Resource.findOrCreate({
    where: compositeKey,
    defaults: record,
  });

  if (!created) {
    await resource.update(record);
  }

  const action = created ? 'created' : 'updated';
  console.log(`  ✅ ${action === 'created' ? 'Created' : 'Updated'}: "${record.title}" (id=${resource.id})`);
  return { success: true, action };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const dry = !!opts.dry;

  if (!opts.file && !opts.dir) {
    console.error('Usage: node scripts/resource-import.js --file <path.json> | --dir <directory>');
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

  console.log(`\n🚀 Importing ${files.length} resource file(s)${dry ? ' [DRY RUN]' : ''}...\n`);

  if (!dry) {
    try {
      await sequelize.authenticate();
    } catch (err) {
      console.error('❌ DB connection error:', err.message);
      process.exit(1);
    }
  }

  let created = 0, updated = 0, failed = 0;

  for (const f of files) {
    console.log(`\n📂 ${path.basename(f)}`);
    try {
      const result = await importResourceFile(f, dry);
      if (!result.success) {
        failed++;
      } else if (result.action === 'created') {
        created++;
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Done: ${created} created, ${updated} updated, ${failed} failed`);
  if (!dry) process.exit(0);
}

module.exports = { parseArgs, buildSummary, buildCompositeKey, buildDbRecord };

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Fatal:', err.message || err);
    process.exit(1);
  });
}
