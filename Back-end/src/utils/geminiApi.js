/**
 * Google Generative Language API — generateContent
 * https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent
 *
 * GEMINI_API_VERSION: v1 (mặc định, ổn định — khớp GCP console) | v1beta | v1alpha
 */
const ALLOWED_VERSIONS = new Set(['v1', 'v1beta', 'v1alpha']);

function normalizeGeminiApiVersion(raw) {
  const v = String(raw || 'v1')
    .trim()
    .toLowerCase();
  if (ALLOWED_VERSIONS.has(v)) return v;
  console.warn(`[geminiApi] Invalid GEMINI_API_VERSION="${raw}", falling back to v1`);
  return 'v1';
}

function getGeminiApiVersion() {
  return normalizeGeminiApiVersion(process.env.GEMINI_API_VERSION);
}

/** Full URL for generateContent (API key query param). */
function geminiGenerateContentUrl(modelId, apiKey) {
  const version = getGeminiApiVersion();
  const model = String(modelId || '').trim();
  if (!model) throw new Error('Gemini model id is empty');
  if (!apiKey) throw new Error('Gemini API key is empty');
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

module.exports = {
  getGeminiApiVersion,
  geminiGenerateContentUrl,
  ALLOWED_VERSIONS,
};
