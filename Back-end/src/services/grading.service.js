// src/services/grading.service.js
const Test = require('../models/test.model');
const TestQuestion = require('../models/testQuestion.model');
const TestAttempt = require('../models/testAttempt.model');
const GradingCache = require('../models/gradingCache.model');
const AIService = require('./ai.service');
const { hashJsonStable } = require('../utils/hashUtils');

function normalizeTextAnswer(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function toLetterFromIndex(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 25) return null;
  return String.fromCharCode(65 + n);
}

function normalizeTfngLike(v) {
  const raw = normalizeTextAnswer(v).toUpperCase();
  if (!raw) return '';
  if (raw === 'T' || raw === 'TRUE') return 'TRUE';
  if (raw === 'F' || raw === 'FALSE') return 'FALSE';
  if (raw === 'Y' || raw === 'YES') return 'YES';
  if (raw === 'N' || raw === 'NO') return 'NO';
  if (raw === 'NG' || raw === 'NOT GIVEN' || raw === 'NOTGIVEN') return 'NOT GIVEN';
  return raw;
}

function splitAcceptedAnswers(correctAnswer) {
  if (correctAnswer === null || correctAnswer === undefined) return [];
  const raw = String(correctAnswer);
  return raw
    .split(/[|/;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isCorrectObjectiveAnswer(q, userAns) {
  const qType = String(q.question_type || '').toUpperCase();

  // TFNG / YNNG normalization
  if (qType === 'TRUE_FALSE_NOT_GIVEN' || qType === 'TFNG' || qType === 'YES_NO_NOT_GIVEN' || qType === 'YNNG') {
    const userNorm = normalizeTfngLike(userAns);
    const accepted = splitAcceptedAnswers(q.correct_answer).map(normalizeTfngLike);
    return userNorm.length > 0 && accepted.includes(userNorm);
  }

  // MCQ: support index, letter, and option text
  if (Array.isArray(q.options) && q.options.length > 0) {
    const accepted = splitAcceptedAnswers(q.correct_answer).map((v) => normalizeTextAnswer(v).toUpperCase());
    const userLetter = toLetterFromIndex(userAns);
    const candidates = [
      normalizeTextAnswer(userAns).toUpperCase(),
      userLetter || '',
    ];
    const userIndex = Number(userAns);
    if (Number.isInteger(userIndex) && userIndex >= 0 && userIndex < q.options.length) {
      candidates.push(normalizeTextAnswer(q.options[userIndex]).toUpperCase());
    }

    // If DB stores correct as letter (A/B/...), map to option text too
    for (const a of accepted) {
      if (/^[A-Z]$/.test(a)) {
        const idx = a.charCodeAt(0) - 65;
        if (idx >= 0 && idx < q.options.length) {
          const optText = normalizeTextAnswer(q.options[idx]).toUpperCase();
          if (candidates.includes(optText)) return true;
        }
      }
    }
    return candidates.some((c) => c && accepted.includes(c));
  }

  // Fill/short answers: accept multiple answers separated by | / ;
  const userNorm = normalizeTextAnswer(userAns);
  const accepted = splitAcceptedAnswers(q.correct_answer).map((v) => normalizeTextAnswer(v));
  return userNorm.length > 0 && accepted.includes(userNorm);
}

function computeObjectiveResult(questions, answers) {
  const ordered = [...questions].sort((a, b) => {
    const sa = a.section_id || 0;
    const sb = b.section_id || 0;
    if (sa !== sb) return sa - sb;
    return (a.question_no || 0) - (b.question_no || 0);
  });

  const detail = [];
  let correct = 0;
  let total = 0;

  const getAnswerByIndex = (idx) => {
    if (!answers) return undefined;
    if (Array.isArray(answers)) return answers[idx];
    if (typeof answers === 'object') return answers[idx];
    return undefined;
  };

  for (let idx = 0; idx < ordered.length; idx++) {
    const q = ordered[idx];
    if (q.correct_answer === null || q.correct_answer === undefined) continue;
    total += 1;

    let userAns;
    if (answers && typeof answers === 'object' && !Array.isArray(answers) && q.public_id && answers[q.public_id] !== undefined) {
      userAns = answers[q.public_id];
    } else {
      userAns = getAnswerByIndex(idx);
    }

    const ok = isCorrectObjectiveAnswer(q, userAns);
    if (ok) correct += 1;

    detail.push({
      public_id: q.public_id,
      question_no: q.question_no,
      section_id: q.section_id,
      question_type: q.question_type,
      user_answer: userAns ?? null,
      correct_answer: q.correct_answer,
      is_correct: ok,
      correct: ok,
    });
  }

  const score = total === 0 ? 0 : correct / total;
  return { correct, total, score, detail };
}

function buildCacheKey({ testId, testType, answerHash, rubricVer = 'v1', aiProvider = 'gemini' }) {
  return `${testType}:${testId}:${answerHash}:${rubricVer}:${aiProvider}`;
}

async function getValidCache(cacheKey) {
  const now = new Date();
  const cached = await GradingCache.findOne({ where: { cache_key: cacheKey } });
  if (!cached) return null;
  if (cached.expires_at && cached.expires_at <= now) return null;

  cached.hit_count += 1;
  await cached.save();
  return cached;
}

async function saveCache({ cacheKey, testType, answerHash, rubricVer, aiProvider, resultJson }) {
  const ttlDays = Number(process.env.GRADING_CACHE_TTL_DAYS || 30);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  await GradingCache.create({
    cache_key: cacheKey,
    test_type: testType,
    answer_hash: answerHash,
    rubric_ver: rubricVer || 'v1',
    ai_provider: aiProvider || 'gemini',
    result_json: resultJson,
    expires_at: expiresAt,
  });
}

async function gradeTestAttempt({ userId, testId, answers, rubricVer = 'v1', aiProvider = 'gemini' }) {
  const test = await Test.findByPk(testId);
  if (!test) throw new Error('Test not found');

  const testType = test.test_type;
  const answerHash = hashJsonStable({ testId, testType, answers, rubricVer, aiProvider });
  const cacheKey = buildCacheKey({ testId, testType, answerHash, rubricVer, aiProvider });

  // Create attempt early (so realtime can reference attempt_id)
  const attempt = await TestAttempt.create({
    user_id: userId,
    test_id: testId,
    test_type: testType,
    status: 'grading',
    answers,
    answer_hash: answerHash,
  });

  // Cache lookup
  const cached = await getValidCache(cacheKey);
  if (cached) {
    attempt.status = 'graded';
    attempt.cache_hit = true;
    attempt.result_json = cached.result_json;
    attempt.graded_at = new Date();

    if (cached.result_json?.overall !== undefined) attempt.score_numeric = Number(cached.result_json.overall);
    if (cached.result_json?.score !== undefined) attempt.score_numeric = Number(cached.result_json.score);
    if (cached.result_json?.correct !== undefined) attempt.correct_count = Number(cached.result_json.correct);
    if (cached.result_json?.total !== undefined) attempt.total_count = Number(cached.result_json.total);

    await attempt.save();
    return { attempt, result: cached.result_json, cacheHit: true };
  }

  // Grade
  let resultJson;
  if (testType === 'reading' || testType === 'listening') {
    const questions = await TestQuestion.findAll({
      where: { test_id: testId },
      order: [['section_id', 'ASC'], ['question_no', 'ASC']],
    });
    resultJson = computeObjectiveResult(questions, answers);
    attempt.correct_count = resultJson.correct;
    attempt.total_count = resultJson.total;
    attempt.score_numeric = resultJson.score;
  } else if (testType === 'writing') {
    const essay =
      (answers && typeof answers === 'object' && !Array.isArray(answers) && (answers.essay || answers.text || answers.answer)) ||
      (typeof answers === 'string' ? answers : '');
    const aiResult = await AIService.gradeWriting(essay);
    // ai.service may return object or raw text; normalize to object
    if (typeof aiResult === 'string') {
      try { resultJson = JSON.parse(aiResult); } catch (e) { resultJson = { raw: aiResult }; }
    } else {
      resultJson = aiResult;
    }
    if (resultJson?.overall !== undefined) attempt.score_numeric = Number(resultJson.overall);
  } else if (testType === 'speaking') {
    const transcript =
      (answers && typeof answers === 'object' && !Array.isArray(answers) && (answers.transcript || answers.text || answers.answer)) ||
      (typeof answers === 'string' ? answers : '');
    const aiResult = await AIService.gradeSpeaking(transcript);
    if (typeof aiResult === 'string') {
      try { resultJson = JSON.parse(aiResult); } catch (e) { resultJson = { raw: aiResult }; }
    } else {
      resultJson = aiResult;
    }
    if (resultJson?.overall !== undefined) attempt.score_numeric = Number(resultJson.overall);
  } else {
    throw new Error(`Unsupported test_type: ${testType}`);
  }

  attempt.status = 'graded';
  attempt.result_json = resultJson;
  attempt.graded_at = new Date();
  await attempt.save();

  // Save cache best-effort (avoid failing grading if cache write fails)
  try {
    await saveCache({ cacheKey, testType, answerHash, rubricVer, aiProvider, resultJson });
  } catch (e) {
    // ignore
  }

  return { attempt, result: resultJson, cacheHit: false };
}

module.exports = { gradeTestAttempt, buildCacheKey };

