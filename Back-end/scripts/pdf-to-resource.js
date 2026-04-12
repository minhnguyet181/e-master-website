#!/usr/bin/env node
/**
 * pdf-to-resource.js
 * Parse a PDF file into the Resource_JSON format using AI (Gemini/OpenAI).
 *
 * Usage (from Back-end/):
 *   node scripts/pdf-to-resource.js --pdf "../path/to/file.pdf"
 *   node scripts/pdf-to-resource.js --pdf "file.pdf" --type grammar_rule --skill grammar --exam IELTS
 *   node scripts/pdf-to-resource.js --pdf "file.pdf" --dry
 *
 * Options:
 *   --pdf    Path to PDF file (required)
 *   --type   resource_type override (optional, AI infers if absent)
 *   --skill  skill override (optional, AI infers if absent)
 *   --exam   exam_type override: IELTS | TOEIC | general (optional)
 *   --out    Output directory or file path (default: generated-resources/)
 *   --dry    Dry run: print JSON to stdout, don't write file
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { validateResourceJSON, RESOURCE_TYPES, SKILLS, EXAM_TYPES } = require('../src/utils/resource-schema');

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
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
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

async function callAI(prompt, maxTokens = 8192) {
  try {
    return await callGemini(prompt, maxTokens);
  } catch (err) {
    if (process.env.OPENAI_API_KEY) {
      console.warn('  ⚠️  Gemini failed, falling back to OpenAI...');
      return callOpenAI(prompt, maxTokens);
    }
    throw err;
  }
}

// ── prompt builder ────────────────────────────────────────────────────────────

function buildResourcePrompt(pdfText, opts = {}) {
  const typeHint = opts.type ? `resource_type: "${opts.type}"` : 'resource_type: (infer from content)';
  const skillHint = opts.skill ? `skill: "${opts.skill}"` : 'skill: (infer from content)';
  const examHint = opts.exam ? `exam_type: "${opts.exam}"` : 'exam_type: (infer: IELTS | TOEIC | general)';

  return `You are a learning resource extractor for an IELTS/TOEIC study platform. Extract the content from the PDF text below and return ONLY valid JSON matching the exact schema shown. No explanation, no markdown prose outside the JSON block.

Hints from user:
- ${typeHint}
- ${skillHint}
- ${examHint}

TARGET SCHEMA:
\`\`\`json
{
  "title": "<concise descriptive title>",
  "language": "en | vi | both",
  "content": {
    "en": "<full English content extracted from PDF, must not be empty>",
    "vi": "<Vietnamese translation or explanation, or null if not present>"
  },
  "taxonomy": {
    "exam_type": "IELTS | TOEIC | general",
    "skill": "reading | listening | writing | speaking | vocabulary | grammar | general",
    "resource_type": "grammar_rule | vocabulary | ielts_tip | toeic_tip | reference | example | template | article",
    "level": "<e.g. Band 6-7, Intermediate, TOEIC 500-700, or null>",
    "topic": "<specific topic slug e.g. present_perfect, task2_opinion, or null>",
    "tags": ["<tag1>", "<tag2>"]
  },
  "summary": "<1-2 sentence summary of the resource, max 500 chars>",
  "metadata": {
    "source": "<source name or null>",
    "author": "<author or null>",
    "word_count": <number>,
    "estimated_read_minutes": <number>
  }
}
\`\`\`

Rules:
- content.en MUST be non-empty — include the full extracted English text.
- taxonomy.tags must have at most 20 items.
- Infer taxonomy fields from content if not hinted above.
- Return the JSON wrapped in a \`\`\`json ... \`\`\` code block.

PDF TEXT:
---
${pdfText}
---`;
}

// ── chunking ──────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 28000;

/**
 * Split text into chunks of at most CHUNK_SIZE characters.
 * Exported for testability.
 */
function splitIntoChunks(text, chunkSize = CHUNK_SIZE) {
  if (text.length <= chunkSize) return [text];
  const chunks = [];
  let offset = 0;
  while (offset < text.length) {
    chunks.push(text.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  return chunks;
}

/**
 * Process a long PDF text by splitting into chunks, calling AI on each,
 * then merging the results into a single Resource_JSON.
 */
async function processInChunks(pdfText, opts) {
  const chunks = splitIntoChunks(pdfText);
  console.log(`  📄 Text length ${pdfText.length} chars — splitting into ${chunks.length} chunks...`);

  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  🔄 Processing chunk ${i + 1}/${chunks.length}...`);
    const prompt = buildResourcePrompt(chunks[i], opts);
    const raw = await callAI(prompt, 8192);
    const parsed = extractJSON(raw);
    if (parsed) {
      results.push(parsed);
    } else {
      console.warn(`  ⚠️  Could not parse chunk ${i + 1}, skipping.`);
    }
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  if (!results.length) return null;

  // Merge: use first chunk's metadata, concatenate content.en
  const merged = results[0];
  if (results.length > 1) {
    const enParts = results.map(r => r.content?.en).filter(Boolean);
    const viParts = results.map(r => r.content?.vi).filter(Boolean);
    merged.content = {
      en: enParts.join('\n\n'),
      vi: viParts.length ? viParts.join('\n\n') : null,
    };
    // Merge tags (deduplicate, cap at 20)
    const allTags = results.flatMap(r => r.taxonomy?.tags || []);
    if (merged.taxonomy) {
      merged.taxonomy.tags = [...new Set(allTags)].slice(0, 20);
    }
  }

  return merged;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (!opts.pdf) {
    console.error('Usage: node scripts/pdf-to-resource.js --pdf <path> [--type <resource_type>] [--skill <skill>] [--exam <exam_type>] [--out <path>] [--dry]');
    console.error(`  --type: ${RESOURCE_TYPES.join(' | ')}`);
    console.error(`  --skill: ${SKILLS.join(' | ')}`);
    console.error(`  --exam: ${EXAM_TYPES.join(' | ')}`);
    process.exit(1);
  }

  // Validate CLI enum args if provided
  if (opts.type && !RESOURCE_TYPES.includes(opts.type)) {
    console.error(`--type must be one of: ${RESOURCE_TYPES.join(', ')}`);
    process.exit(1);
  }
  if (opts.skill && !SKILLS.includes(opts.skill)) {
    console.error(`--skill must be one of: ${SKILLS.join(', ')}`);
    process.exit(1);
  }
  if (opts.exam && !EXAM_TYPES.includes(opts.exam)) {
    console.error(`--exam must be one of: ${EXAM_TYPES.join(', ')}`);
    process.exit(1);
  }

  const pdfPath = path.resolve(opts.pdf);
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF not found:', pdfPath);
    process.exit(1);
  }

  console.log(`\n📖 Reading PDF: ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text;
  console.log(`  ✅ Extracted ${pdfText.length} characters`);

  // Choose processing path
  let result;
  if (pdfText.length > CHUNK_SIZE) {
    result = await processInChunks(pdfText, opts);
  } else {
    console.log('\n🤖 Calling AI to parse resource...');
    const prompt = buildResourcePrompt(pdfText, opts);
    const raw = await callAI(prompt, 8192);
    result = extractJSON(raw);
  }

  if (!result) {
    console.error('❌ Could not extract valid JSON from AI response.');
    process.exit(1);
  }

  // Apply CLI overrides
  if (opts.type) {
    result.resource_type = opts.type;
    if (result.taxonomy) result.taxonomy.resource_type = opts.type;
  }
  if (opts.skill) {
    result.skill = opts.skill;
    if (result.taxonomy) result.taxonomy.skill = opts.skill;
  }
  if (opts.exam && result.taxonomy) {
    result.taxonomy.exam_type = opts.exam;
  }

  // Ensure top-level fields mirror taxonomy for schema validation
  if (!result.resource_type && result.taxonomy?.resource_type) {
    result.resource_type = result.taxonomy.resource_type;
  }
  if (!result.skill && result.taxonomy?.skill) {
    result.skill = result.taxonomy.skill;
  }

  // Guard: content.en must not be empty
  if (!result.content?.en || result.content.en.trim() === '') {
    console.error('❌ content.en is empty after parse. Cannot create resource file.');
    process.exit(1);
  }

  // Validate against schema
  const validation = validateResourceJSON(result);
  if (!validation.valid) {
    console.error('❌ Schema validation failed:');
    validation.errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  console.log('\n✅ Resource parsed and validated successfully.');

  if (opts.dry) {
    console.log('\n--- JSON OUTPUT ---');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Determine output path
  let outPath = opts.out;
  if (!outPath) {
    const outDir = path.join(__dirname, '../../generated-resources');
    fs.mkdirSync(outDir, { recursive: true });
    const slug = (result.title || 'resource')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    outPath = path.join(outDir, `${slug}-${Date.now()}.json`);
  } else if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
    const slug = (result.title || 'resource')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    outPath = path.join(outPath, `${slug}-${Date.now()}.json`);
  }

  outPath = path.resolve(outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n💾 Saved to: ${outPath}`);
  console.log(`\nNext step: node scripts/resource-import.js --file "${outPath}"`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { splitIntoChunks, buildResourcePrompt, extractJSON, callAI, CHUNK_SIZE };
