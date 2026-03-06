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

    return await UserSubmission.create({
      user_id: userId,
      test_id: testId,
      answers: { essay },
      score: JSON.parse(ai).overall,
      ai_feedback: ai,
    });
  }

  static async submitSpeaking(userId, testId, transcript) {
    const ai = await AIService.gradeSpeaking(transcript);

    return await UserSubmission.create({
      user_id: userId,
      test_id: testId,
      answers: { transcript },
      score: JSON.parse(ai).overall,
      ai_feedback: ai,
    });
  }
}

module.exports = SubmissionService;
