/**
 * adminUpload.controller.js
 * PDF upload → AI parse → preview → DB import pipeline.
 *
 * POST /e-master/admin/upload-pdf      multipart: file, category, exam?, skill?
 * POST /e-master/admin/import-resource json: { resourceJson }
 * GET  /e-master/admin/categories
 */

const { buildResourcePrompt, extractJSON, splitIntoChunks, callAI, CHUNK_SIZE } = require('../../scripts/pdf-to-resource');
const { buildDbRecord, buildCompositeKey } = require('../../scripts/resource-import');
const { validateResourceJSON } = require('../utils/resource-schema');
const Resource = require('../models/resource.model');

// ── Category → taxonomy hint mapping ─────────────────────────────────────────

const CATEGORY_HINTS = {
  exam_test: {
    label: 'Đề thi (Exam / Test)',
    resource_type: 'reference',
    description: 'Full IELTS/TOEIC practice test or past paper',
  },
  study_material: {
    label: 'Tài liệu học tập',
    resource_type: null,
    description: 'Grammar rules, vocabulary lists, reading/listening materials',
  },
  exam_tip: {
    label: 'Mẹo thi (Tips & Strategies)',
    resource_type: null,
    description: 'Test-taking strategies, band score tips, task templates',
  },
  reference: {
    label: 'Bài viết tham khảo',
    resource_type: 'article',
    description: 'Sample essays, model answers, reference articles',
  },
};

// ── Parse PDF buffer → Resource JSON ─────────────────────────────────────────

async function parsePdfToResource(pdfBuffer, opts = {}) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(pdfBuffer);
  const pdfText = data.text;

  if (!pdfText || pdfText.trim().length === 0) {
    throw new Error('Could not extract text from PDF');
  }

  let result;

  if (pdfText.length > CHUNK_SIZE) {
    const chunks = splitIntoChunks(pdfText);
    const results = [];
    for (const chunk of chunks) {
      const raw = await callAI(buildResourcePrompt(chunk, opts));
      const parsed = extractJSON(raw);
      if (parsed) results.push(parsed);
    }
    if (!results.length) throw new Error('AI returned no valid JSON from any chunk');
    result = results[0];
    if (results.length > 1) {
      result.content = {
        en: results.map(r => r.content?.en).filter(Boolean).join('\n\n'),
        vi: results.map(r => r.content?.vi).filter(Boolean).join('\n\n') || null,
      };
      const allTags = results.flatMap(r => r.taxonomy?.tags || []);
      if (result.taxonomy) result.taxonomy.tags = [...new Set(allTags)].slice(0, 20);
    }
  } else {
    const raw = await callAI(buildResourcePrompt(pdfText, opts));
    result = extractJSON(raw);
  }

  if (!result) throw new Error('AI returned no valid JSON');

  if (opts.type) { result.resource_type = opts.type; if (result.taxonomy) result.taxonomy.resource_type = opts.type; }
  if (opts.skill) { result.skill = opts.skill; if (result.taxonomy) result.taxonomy.skill = opts.skill; }
  if (opts.exam && result.taxonomy) result.taxonomy.exam_type = opts.exam;

  if (!result.resource_type && result.taxonomy?.resource_type) result.resource_type = result.taxonomy.resource_type;
  if (!result.skill && result.taxonomy?.skill) result.skill = result.taxonomy.skill;

  if (!result.content?.en || result.content.en.trim() === '') {
    throw new Error('content.en is empty after AI parse');
  }

  return result;
}

// ── Controllers ───────────────────────────────────────────────────────────────

exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const category = req.body.category || 'study_material';
    const hint = CATEGORY_HINTS[category];
    if (!hint) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Valid: ${Object.keys(CATEGORY_HINTS).join(', ')}`,
      });
    }

    const opts = {
      type: hint.resource_type || undefined,
      exam: req.body.exam || undefined,
      skill: req.body.skill || undefined,
    };

    const resourceJson = await parsePdfToResource(req.file.buffer, opts);

    const validation = validateResourceJSON(resourceJson);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: 'Schema validation failed', details: validation.errors });
    }

    return res.status(200).json({ success: true, category, categoryLabel: hint.label, resourceJson });
  } catch (err) {
    console.error('[adminUpload] uploadPdf error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.importResource = async (req, res) => {
  try {
    const { resourceJson } = req.body;
    if (!resourceJson) {
      return res.status(400).json({ success: false, error: 'resourceJson is required' });
    }

    const validation = validateResourceJSON(resourceJson);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: 'Schema validation failed', details: validation.errors });
    }

    const record = buildDbRecord(resourceJson);
    const compositeKey = buildCompositeKey(resourceJson);

    const [resource, created] = await Resource.findOrCreate({
      where: compositeKey,
      defaults: record,
    });

    if (!created) await resource.update(record);

    return res.status(200).json({
      success: true,
      action: created ? 'created' : 'updated',
      id: resource.id,
      title: resource.title,
    });
  } catch (err) {
    console.error('[adminUpload] importResource error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCategories = (_req, res) => {
  const categories = Object.entries(CATEGORY_HINTS).map(([key, val]) => ({
    key,
    label: val.label,
    description: val.description,
  }));
  return res.status(200).json({ success: true, categories });
};
