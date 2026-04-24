// src/services/ai.service.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const axios = require('axios');
const AICache = require('../models/aiCache.model');
const { hashJsonStable } = require('../utils/hashUtils');

/** Chuẩn hóa key: trim, bỏ BOM UTF-8, bỏ ngoặc, không dùng URL làm key; sửa typo thừa "y" trước AIza */
function normalizeGeminiApiKey(raw) {
  if (raw == null || raw === '') return '';
  let k = String(raw).trim();
  if (k.charCodeAt(0) === 0xfeff) k = k.slice(1).trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
  const fromUrl = k.match(/[?&]key=([^&]+)/);
  if (fromUrl) {
    try {
      k = decodeURIComponent(fromUrl[1]);
    } catch {
      k = fromUrl[1];
    }
  }
  if (k.startsWith('yAIza')) {
    k = k.slice(1);
    console.warn('[ai.service] GEMINI_API_KEY had a stray leading "y" before AIza — fixed. Check your .env.');
  }
  return k.trim();
}

const GEMINI_KEY = normalizeGeminiApiKey(process.env.GEMINI_API_KEY);
const HF_TOKEN = process.env.HF_TOKEN || '';
/** Model: gemini-1.5-flash ổn định với API key thường; đổi qua GEMINI_MODEL nếu cần */
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim();
const AI_CACHE_TTL_MINUTES = Number(process.env.AI_CACHE_TTL_MINUTES || 60);

async function getValidAICache(cacheKey) {
  const now = new Date();
  const row = await AICache.findOne({ where: { cache_key: cacheKey } });
  if (!row) return null;
  if (row.expires_at && row.expires_at <= now) return null;
  row.hit_count += 1;
  await row.save();
  return row;
}

async function saveAICache({ cacheKey, cacheType, model, promptHash, resultText }) {
  const ttlMs = Math.max(AI_CACHE_TTL_MINUTES, 0) * 60 * 1000;
  const expiresAt = ttlMs > 0 ? new Date(Date.now() + ttlMs) : null;
  await AICache.create({
    cache_key: cacheKey,
    cache_type: cacheType,
    model: model || null,
    prompt_hash: promptHash,
    result_text: resultText,
    expires_at: expiresAt,
  });
}

/**
 * Helper: clean and try to parse JSON within AI text
 */
function tryParseJSONFromText(text) {
  if (!text || typeof text !== 'string') return text;
  // Prefer fenced ```json blocks if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through to outermost braces extraction
    }
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // return raw text fallback
      return text;
    }
  }
  return text;
}

function safeParseJsonObject(maybeText) {
  if (maybeText && typeof maybeText === 'object') return { ok: true, value: maybeText };
  if (typeof maybeText !== 'string') return { ok: false, value: null, raw: maybeText };
  const parsed = tryParseJSONFromText(maybeText);
  if (parsed && typeof parsed === 'object') return { ok: true, value: parsed };
  return { ok: false, value: null, raw: maybeText };
}

/* ---------- Gemini call with retry logic ---------- */
async function callGemini(prompt, maxTokens = 800, retries = 3) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured');
  
  // Clean prompt - remove any problematic characters
  const cleanPrompt = typeof prompt === 'string' ? prompt.trim() : String(prompt).trim();
  
  if (!cleanPrompt || cleanPrompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: cleanPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: maxTokens,
      topP: 0.95,
      topK: 40
    }
  };
  
  // Retry logic for transient errors (503, 429, etc.)
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(url, body, { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 seconds timeout
      });
      
      // Check for errors in response
      if (res.data.error) {
        throw new Error(`Gemini API Error: ${res.data.error.message || JSON.stringify(res.data.error)}`);
      }
      
      const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  res.data?.candidates?.[0]?.content?.[0]?.text || 
                  '';
      
      if (!raw && res.data.candidates && res.data.candidates.length > 0) {
        console.warn('⚠️  No text in response, full response:', JSON.stringify(res.data, null, 2));
      }
      
      return raw;
      
    } catch (error) {
      // Check if it's a retryable error
      const isRetryable = error.response && (
        error.response.status === 503 || // Service Unavailable
        error.response.status === 429 || // Too Many Requests
        error.response.status === 500 || // Internal Server Error
        error.response.status === 502 || // Bad Gateway
        (error.response.status === 404 && error.response.data?.error?.message?.includes('overloaded'))
      );
      
      if (isRetryable && attempt < retries) {
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000; // milliseconds
        console.warn(`⚠️  Gemini API temporarily unavailable (attempt ${attempt}/${retries}). Retrying in ${waitTime/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Retry
      }
      
      // Enhanced error logging for final attempt or non-retryable errors
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error?.message || errorData?.message || JSON.stringify(errorData);
        const status = error.response.status;
        
        if (isRetryable) {
          console.error(`❌ Gemini API Error after ${retries} attempts: ${errorMessage}`);
        } else {
          console.error('❌ Gemini API Error Response:', errorMessage);
        }
        console.error('❌ Status:', status);
        console.error('❌ Full Error Data:', JSON.stringify(errorData, null, 2));
        
        // Provide helpful error messages
        if (status === 503) {
          throw new Error(`Gemini API is currently overloaded. Please try again in a few moments. (Status: ${status})`);
        } else if (status === 429) {
          throw new Error(`Gemini API rate limit exceeded. Please wait before making more requests. (Status: ${status})`);
        } else {
          throw new Error(`Gemini API Error (${status}): ${errorMessage}`);
        }
      }
      
      // Non-HTTP errors (network, timeout, etc.)
      throw error;
    }
  }
}

/* ---------- HuggingFace text call (fallback) ---------- */
async function callHuggingFaceText(model, prompt, timeout = 60000) {
  if (!HF_TOKEN) throw new Error('HF_TOKEN not configured');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await axios.post(url, { inputs: prompt }, {
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
    timeout
  });
  const data = res.data;
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
  if (typeof data === 'string') return data;
  if (data.generated_text) return data.generated_text;
  return JSON.stringify(data);
}

/* ---------- Transcription via HF Whisper (optional) ---------- */
async function transcribeAudioHF(audioBuffer, contentType = 'audio/webm') {
  if (!HF_TOKEN) throw new Error('HF_TOKEN not configured');
  const url = 'https://api-inference.huggingface.co/models/openai/whisper-small';
  const res = await axios.post(url, audioBuffer, {
    headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': contentType },
    timeout: 120000
  });
  // HF response may vary
  return res.data?.text || res.data?.transcription?.text || JSON.stringify(res.data);
}

/* ---------- Generate Learning Plan (structured JSON) ---------- */
async function generateLearningPlan(userData) {
  const prompt = `You are an expert IELTS/TOEIC teacher. Your task is to create a personalized learning plan based on the user's information.

IMPORTANT: You MUST return ONLY valid JSON. Do NOT include any markdown formatting, code blocks, or explanations before or after the JSON. Start directly with { and end with }.

Required JSON structure (all fields are required):
{
  "summary": "A brief 2-3 sentence analysis of the user's learning situation and goals",
  "duration_weeks": 8,
  "weekly_plan": [
    {
      "week": 1,
      "goals": ["Goal 1"],
      "skills_focus": ["Writing", "Reading"],   
    }
  ],
  "recommended_materials": [
    { "type": "book", "title": "Material Title", "url": "https://example.com or null" }
  ]
}

User Information:
- Learning goal: ${userData.learningGoal || userData.goal || 'Not specified'}
- Current band: ${userData.currentBand || 'Not specified'}
- Target band: ${userData.targetBand || userData.band_target || 'Not specified'}
- Daily study hours: ${userData.dailyStudyHours || userData.study_hours_per_day || 'Not specified'}
- Learning purpose: ${userData.learningPurpose || userData.reason || 'Not specified'}

Instructions:
1. Create a realistic learning plan based on the gap between current and target band
2. Calculate duration_weeks based on the band gap (approximately 7-8 weeks per 0.5 band improvement)
3. Generate at least short 4-6 weeks of weekly_plan
4. Focus on skills that need improvement
5. Provide specific, actionable goals and assignments
6. Recommend relevant learning materials

Return ONLY the JSON object. No other text.`;

  const promptHash = hashJsonStable({ type: 'learning_plan', prompt, model: GEMINI_MODEL });
  const cacheKey = `learning_plan:${promptHash}:${GEMINI_MODEL}`;
  try {
    const cached = await getValidAICache(cacheKey);
    if (cached) return cached.result_text;
  } catch {
    // ignore cache failures
  }

  let raw;
  if (GEMINI_KEY) raw = await callGemini(prompt, 1200);
  else if (HF_TOKEN) raw = await callHuggingFaceText('google/flan-t5-large', prompt);
  else throw new Error('No AI provider configured');
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    await saveAICache({ cacheKey, cacheType: 'learning_plan', model: GEMINI_MODEL, promptHash, resultText: cleaned });
  } catch {
    // ignore
  }

  return cleaned;
}

/* ---------- Grade writing: returns JSON ---------- */
async function gradeWriting(essay) {
  if (!essay || typeof essay !== 'string' || essay.trim().length === 0) {
    throw new Error('Essay content is required and cannot be empty');
  }

  const prompt = `You are an experienced IELTS Writing examiner. Evaluate this essay according to official IELTS Writing Task 2 criteria.

IMPORTANT: You MUST return ONLY valid JSON. Do NOT include any markdown formatting, code blocks, or explanations. Start directly with { and end with }.

Required JSON structure (all fields are required):
{
  "task_response": 6.0,
  "coherence_cohesion": 6.5,
  "lexical_resource": 6.0,
  "grammar": 6.5,
  "overall": 6.25,
  "feedback": "A clear and detailed feedback paragraph (3-4 sentences) explaining the overall performance",
  "suggestions": ["Specific improvement tip 1", "Specific improvement tip 2", "Specific improvement tip 3"]
}

Scoring Guidelines:
- Task Response (0-9): How well the essay addresses the task, presents a clear position, and develops ideas
- Coherence & Cohesion (0-9): Organization, paragraphing, and use of cohesive devices
- Lexical Resource (0-9): Range and accuracy of vocabulary
- Grammar (0-9): Range and accuracy of grammatical structures
- Overall: Average of the four criteria, rounded to nearest 0.25

Essay to evaluate:
${essay}

Instructions:
1. Score each criterion accurately based on IELTS standards
2. Provide constructive feedback that helps the student improve
3. Give 3 specific, actionable suggestions
4. Calculate overall score as the average of four criteria

Return ONLY the JSON object. No other text.`;

  let raw;
  if (GEMINI_KEY) raw = await callGemini(prompt, 800);
  else if (HF_TOKEN) raw = await callHuggingFaceText('google/flan-t5-large', prompt);
  else throw new Error('No AI provider configured for gradeWriting');

  const parsed = tryParseJSONFromText(raw);
  return parsed;
}

/* ---------- Grade speaking: returns JSON ---------- */
async function gradeSpeaking(transcript) {
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    throw new Error('Transcript content is required and cannot be empty');
  }

  const prompt = `You are an experienced IELTS Speaking examiner. Evaluate this speaking transcript according to official IELTS Speaking criteria.

IMPORTANT: You MUST return ONLY valid JSON. Do NOT include any markdown formatting, code blocks, or explanations. Start directly with { and end with }.

Required JSON structure (all fields are required):
{
  "fluency_and_coherence": 6.0,
  "pronunciation": 6.5,
  "lexical_resource": 6.0,
  "grammar": 6.5,
  "overall": 6.25,
  "feedback": "A clear and detailed feedback paragraph (3-4 sentences) explaining the overall speaking performance",
  "suggestions": ["Specific improvement tip 1", "Specific improvement tip 2"]
}

Scoring Guidelines:
- Fluency & Coherence (0-9): Flow, naturalness, ability to speak without hesitation, logical organization
- Pronunciation (0-9): Clarity, intonation, stress patterns, intelligibility
- Lexical Resource (0-9): Range and accuracy of vocabulary, appropriate word choice
- Grammar (0-9): Range and accuracy of grammatical structures
- Overall: Average of the four criteria, rounded to nearest 0.25

Speaking transcript to evaluate:
${transcript}

Instructions:
1. Score each criterion accurately based on IELTS Speaking standards
2. Provide constructive feedback that helps the student improve
3. Give 2 specific, actionable suggestions for improvement
4. Calculate overall score as the average of four criteria

Return ONLY the JSON object. No other text.`;

  let raw;
  if (GEMINI_KEY) raw = await callGemini(prompt, 800);
  else if (HF_TOKEN) raw = await callHuggingFaceText('google/flan-t5-large', prompt);
  else throw new Error('No AI provider configured for gradeSpeaking');

  const parsed = tryParseJSONFromText(raw);
  return parsed;
}

/* ---------- Chat assistant (free text) ---------- */
async function chatAssistant(message) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message content is required and cannot be empty');
  }

  const prompt = `You are a friendly and knowledgeable English study assistant specializing in IELTS and TOEIC preparation. Your role is to help students improve their English skills.

Guidelines:
- Be helpful, encouraging, and supportive
- Provide clear, concise, and practical advice
- Focus on actionable tips and strategies
- If asked about grammar, vocabulary, or test strategies, provide specific examples
- Keep responses conversational but informative
- If you don't know something, admit it rather than making up information

User's question or message:
${message}

Respond naturally and helpfully:`;

  const promptHash = hashJsonStable({ type: 'chat', prompt, model: GEMINI_MODEL });
  const cacheKey = `chat:${promptHash}:${GEMINI_MODEL}`;
  try {
    const cached = await getValidAICache(cacheKey);
    if (cached) return String(cached.result_text || '').trim();
  } catch {
    // ignore
  }

  let raw;
  if (GEMINI_KEY) raw = await callGemini(prompt, 500);
  else if (HF_TOKEN) raw = await callHuggingFaceText('google/flan-t5-large', prompt);
  else throw new Error('No AI provider configured for chatAssistant');

  // for chat we return raw text (not necessarily JSON)
  const out = raw.trim();
  try {
    await saveAICache({ cacheKey, cacheType: 'chat', model: GEMINI_MODEL, promptHash, resultText: out });
  } catch {
    // ignore
  }
  return out;
}

module.exports = {
  generateLearningPlan,
  gradeWriting,
  gradeSpeaking,
  chatAssistant,
  transcribeAudioHF,
  callGemini, // Export để dùng trong placementTest.service.js
  safeParseJsonObject,
};