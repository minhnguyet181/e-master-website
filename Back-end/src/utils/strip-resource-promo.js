/**
 * Remove common training-center footer blocks often pasted into shared IELTS PDFs
 * (brand line + website / hotline / social — not part of lesson body).
 */

function stripEmbeddedPromoFooters(text) {
  if (!text || typeof text !== 'string') return text;
  let t = text;

  // Trailing block starting with "IELTS Fighter …" (Vietnamese materials)
  t = t.replace(/(?:^|\r?\n)[\s]*IELTS Fighter[\s\S]*$/i, '');

  // Same source sometimes appears without the brand line first
  t = t.replace(/(?:^|\r?\n)[\s]*Website:\s*ielts-fighter\.com[\s\S]*$/i, '');

  // Trailing social/contact block only (facebook groups for this brand)
  t = t.replace(
    /(?:^|\r?\n)[\s]*(?:Fanpage|Group):\s*https?:\/\/(?:www\.)?facebook\.com\/[^\r\n]+(?:\r?\n[^\r\n]*)*$/i,
    ''
  );

  return t.replace(/\n{3,}/g, '\n\n').trim();
}

function sanitizeBilingualContent(content) {
  if (!content || typeof content !== 'object') return content;
  const out = { ...content };
  if (typeof out.en === 'string') out.en = stripEmbeddedPromoFooters(out.en);
  if (typeof out.vi === 'string') out.vi = stripEmbeddedPromoFooters(out.vi);
  return out;
}

/** Stored DB field: JSON string of { en, vi } or plain string */
function sanitizeStoredContentField(raw) {
  if (raw == null) return raw;
  if (typeof raw !== 'string') return raw;
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === 'object' && ('en' in o || 'vi' in o)) {
      return JSON.stringify(sanitizeBilingualContent(o));
    }
  } catch {
    /* fall through */
  }
  return stripEmbeddedPromoFooters(raw);
}

module.exports = {
  stripEmbeddedPromoFooters,
  sanitizeBilingualContent,
  sanitizeStoredContentField,
};
