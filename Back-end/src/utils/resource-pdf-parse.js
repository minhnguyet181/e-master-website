/**
 * Build Resource JSON from raw PDF text (pdf-parse) — no LLM.
 * Output matches resource-schema validation expectations.
 */

const MAX_BODY = 200000;

const CATEGORY_DEFAULTS = {
  study_material: { resource_type: 'article' },
  exam_tip: { resource_type: 'ielts_tip' },
  exam_test: { resource_type: 'reference' },
  practice: { resource_type: 'example' },
  reference: { resource_type: 'article' },
};

function normalizeText(t) {
  return String(t || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function guessTitle(lines, filename) {
  for (const line of lines) {
    const s = line.trim();
    if (s && s.length >= 3 && s.length <= 200) return s;
  }
  const base = (filename || 'document').replace(/\.pdf$/i, '');
  return base.slice(0, 200) || 'Imported PDF';
}

function pickResourceType(category, examType, skill) {
  const cat = category || 'study_material';
  if (cat === 'exam_tip') {
    if (examType === 'TOEIC') return 'toeic_tip';
    return 'ielts_tip';
  }
  if (cat === 'exam_test') return 'reference';
  if (cat === 'practice') return 'example';
  if (cat === 'study_material') {
    if (skill === 'grammar') return 'grammar_rule';
    if (skill === 'vocabulary') return 'vocabulary';
    return 'article';
  }
  return CATEGORY_DEFAULTS[cat]?.resource_type || 'article';
}

function pickSkill(skill) {
  const s = (skill || '').trim().toLowerCase();
  const allowed = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar', 'general'];
  return allowed.includes(s) ? s : 'general';
}

function pickExamType(examType) {
  const e = (examType || '').trim();
  if (e === 'IELTS' || e === 'TOEIC' || e === 'general') return e;
  return 'general';
}

/** Short preview for list cards — avoid cutting mid-word */
function truncateAtWordBoundary(text, maxLen) {
  const t = String(text || '').trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const lastNl = cut.lastIndexOf('\n');
  const breakAt = Math.max(lastSpace, lastNl);
  const head = breakAt > maxLen * 0.55 ? cut.slice(0, breakAt) : cut;
  return `${head.trim()}…`;
}

/**
 * @param {string} pdfText - raw text from pdf-parse
 * @param {object} opts
 * @param {string} [opts.category]
 * @param {string} [opts.exam_type]
 * @param {string} [opts.skill]
 * @param {string} [opts.originalFilename]
 */
function buildResourceFromPdfText(pdfText, opts = {}) {
  const text = normalizeText(pdfText);
  if (!text) throw new Error('Empty text after normalization');

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = guessTitle(lines, opts.originalFilename);
  const body = text.length > MAX_BODY ? `${text.slice(0, MAX_BODY)}\n\n[… truncated …]` : text;

  const examType = pickExamType(opts.exam_type);
  const skill = pickSkill(opts.skill);
  const resourceType = pickResourceType(opts.category, examType, skill);

  const summary = truncateAtWordBoundary(body, 1200);

  const tags = [];
  if (examType && examType !== 'general') tags.push(examType);
  if (skill && skill !== 'general') tags.push(skill);

  return {
    title,
    summary,
    resource_type: resourceType,
    skill,
    language: 'en',
    content: {
      en: body,
      vi: null,
    },
    taxonomy: {
      exam_type: examType,
      skill,
      resource_type: resourceType,
      level: null,
      tags: tags.slice(0, 20),
    },
    metadata: {
      parser: 'pdf-parse',
      non_ai: true,
      category: opts.category || 'study_material',
    },
  };
}

module.exports = {
  buildResourceFromPdfText,
  MAX_BODY,
};
