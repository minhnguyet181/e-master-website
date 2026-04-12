/**
 * admin.controller.js
 * CRUD endpoints for admin content management.
 */
const Resource = require('../models/resource.model');
const { Op } = require('sequelize');
const { buildDbRecord, buildCompositeKey } = require('../../scripts/resource-import');
const { validateResourceJSON } = require('../utils/resource-schema');
const { buildResourcePrompt, extractJSON, splitIntoChunks, callAI, CHUNK_SIZE } = require('../../scripts/pdf-to-resource');

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_MAP = {
  study_material: { label: 'Tài liệu học', resource_types: ['grammar_rule', 'vocabulary', 'article', 'reference', 'example'] },
  exam_tip:       { label: 'Tips học & thi', resource_types: ['ielts_tip', 'toeic_tip', 'template'] },
  exam_test:      { label: 'Đề thi', resource_types: ['reference'], is_test: true },
  practice:       { label: 'Bài luyện tập', resource_types: ['example', 'reference'] },
};

// ── List resources (with filter + pagination) ─────────────────────────────────
exports.listResources = async (req, res) => {
  try {
    const { category, skill, exam_type, q, page = 1, limit = 20 } = req.query;
    const where = {};

    if (category && CATEGORY_MAP[category]) {
      where.resource_type = { [Op.in]: CATEGORY_MAP[category].resource_types };
    }
    if (skill) where.skill = skill;
    if (exam_type) where.exam_type = exam_type;
    if (q) where.title = { [Op.like]: `%${q}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Resource.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: ['id', 'title', 'resource_type', 'skill', 'exam_type', 'level', 'is_active', 'is_featured', 'view_count', 'createdAt'],
    });

    return res.json({
      success: true,
      data: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    console.error('[admin] listResources:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Get single resource ───────────────────────────────────────────────────────
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: resource });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Parse PDF → Resource JSON (preview, no DB write) ─────────────────────────
exports.parsePdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No PDF uploaded' });

    const category = req.body.category || 'study_material';
    const opts = {
      type: req.body.resource_type || undefined,
      skill: req.body.skill || undefined,
      exam: req.body.exam_type || undefined,
    };

    const pdfParse = require('pdf-parse');
    const data = await pdfParse(req.file.buffer);
    const pdfText = data.text;

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(422).json({ success: false, error: 'Could not extract text from PDF' });
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
      if (!results.length) throw new Error('AI returned no valid JSON');
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

    // Mirror taxonomy → top-level
    if (!result.resource_type && result.taxonomy?.resource_type) result.resource_type = result.taxonomy.resource_type;
    if (!result.skill && result.taxonomy?.skill) result.skill = result.taxonomy.skill;

    if (!result.content?.en || result.content.en.trim() === '') {
      return res.status(422).json({ success: false, error: 'content.en is empty after AI parse' });
    }

    const validation = validateResourceJSON(result);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: 'Schema validation failed', details: validation.errors });
    }

    return res.json({ success: true, category, resourceJson: result });
  } catch (err) {
    console.error('[admin] parsePdf:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Import resource JSON → DB ─────────────────────────────────────────────────
exports.importResource = async (req, res) => {
  try {
    const { resourceJson, audio_url } = req.body;
    if (!resourceJson) return res.status(400).json({ success: false, error: 'resourceJson is required' });

    const validation = validateResourceJSON(resourceJson);
    if (!validation.valid) {
      return res.status(422).json({ success: false, error: 'Validation failed', details: validation.errors });
    }

    const record = buildDbRecord(resourceJson);
    if (audio_url) {
      record.metadata = { ...(record.metadata || {}), audio_url };
    }
    const compositeKey = buildCompositeKey(resourceJson);

    const [resource, created] = await Resource.findOrCreate({ where: compositeKey, defaults: record });
    if (!created) await resource.update(record);

    return res.json({ success: true, action: created ? 'created' : 'updated', id: resource.id, title: resource.title });
  } catch (err) {
    console.error('[admin] importResource:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Update resource ───────────────────────────────────────────────────────────
exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' });
    await resource.update(req.body);
    return res.json({ success: true, data: resource });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Soft delete ───────────────────────────────────────────────────────────────
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' });
    await resource.update({ is_active: false });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Toggle featured ───────────────────────────────────────────────────────────
exports.toggleFeatured = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, error: 'Not found' });
    await resource.update({ is_featured: !resource.is_featured });
    return res.json({ success: true, is_featured: resource.is_featured });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const total = await Resource.count();
    const active = await Resource.count({ where: { is_active: true } });
    const byType = await Resource.findAll({
      attributes: ['resource_type', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['resource_type'],
      raw: true,
    });
    return res.json({ success: true, data: { total, active, byType } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.CATEGORY_MAP = CATEGORY_MAP;
