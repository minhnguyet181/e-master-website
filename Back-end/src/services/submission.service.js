// src/services/submission.service.js
const UserSubmission = require('../models/userSubmission.model');
const TestService = require('./test.service');
const AIService = require('./ai.service');

class SubmissionService {

  static async submitReadingListening(userId, testId, answers, isCorrect) {
    return await UserSubmission.create({
      user_id: userId,
      test_id: testId,
      answers,
      is_correct: isCorrect,
    });
  }

  static async submitWriting(userId, testId, essay) {
    const ai = await AIService.gradeWriting(essay);
    let score = null;
    try { score = (typeof ai === 'string' ? JSON.parse(ai) : ai).overall ?? null; } catch (_) {}

    return await UserSubmission.create({
      user_id: userId,
      test_id: testId,
      answers: { essay },
      score,
      ai_feedback: typeof ai === 'string' ? ai : JSON.stringify(ai),
    });
  }

  static async submitSpeaking(userId, testId, transcript) {
    const ai = await AIService.gradeSpeaking(transcript);
    let score = null;
    try { score = (typeof ai === 'string' ? JSON.parse(ai) : ai).overall ?? null; } catch (_) {}

    return await UserSubmission.create({
      user_id: userId,
      test_id: testId,
      answers: { transcript },
      score,
      ai_feedback: typeof ai === 'string' ? ai : JSON.stringify(ai),
    });
  }
}

module.exports = SubmissionService;
