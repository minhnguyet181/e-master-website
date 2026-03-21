const TestService = require('../services/test.service');
const { handleResponse, handleError } = require('./base.controller');
const { gradeTestAttempt } = require('../services/grading.service');
const ProgressService = require('../services/progress.service');
const { sendEvent } = require('../services/sse.service');

exports.getAll = async (req, res) => {
  try {
    const tests = await TestService.getAllTests();
    handleResponse(res, tests);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getBySkill = async (req, res) => {
  try {
    const tests = await TestService.getTestsByType(req.params.skill);
    handleResponse(res, tests);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getById = async (req, res) => {
  try {
    const test = await TestService.getTest(req.params.id);
    handleResponse(res, test);
  } catch (err) {
    handleError(res, err);
  }
};
exports.getCorrectAnswers = async (req, res) => {
  try {
    const answers = await TestService.getCorrectAnswers(req.params.id);      
    handleResponse(res, answers);
  } catch (err) {
    handleError(res, err);
  }
};
exports.getTestWithQuestions = async (req, res) => {
  try {
    const testWithQuestions = await TestService.getTestWithQuestions(req.params.id);  
    handleResponse(res, testWithQuestions);
  } catch (err) {
    handleError(res, err);
  }
};

// POST /test/grade
// Body supports:
// - { testId, answers }
// - { test_id, answers }
// - { testId, userAnswers } (legacy FE)
exports.gradeTest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const testId = req.body.testId || req.body.test_id;
    const answers = req.body.answers ?? req.body.userAnswers ?? req.body.payload ?? {};

    if (!testId) return res.status(400).json({ message: 'testId is required' });

    // Realtime: start
    sendEvent(userId, 'grading_started', { test_id: testId, ts: Date.now() });

    const { attempt, result, cacheHit } = await gradeTestAttempt({
      userId,
      testId,
      answers,
      rubricVer: req.body.rubric_ver || 'v1',
      aiProvider: req.body.ai_provider || 'gemini',
    });

    // Update progress (realtime)
    let progress;
    try {
      progress = await ProgressService.updateProgress(userId, `test_${attempt.test_type}`, 1);
      sendEvent(userId, 'progress_updated', { type: progress.type, completed: progress.completed, total: progress.total, progress: progress.progress });
    } catch (e) {
      // ignore progress failures
    }

    // Realtime: done
    sendEvent(userId, 'grading_done', { attempt_id: attempt.id, test_id: testId, cache_hit: cacheHit, result });

    handleResponse(res, { attempt_id: attempt.id, cache_hit: cacheHit, result, progress }, 'Graded');
  } catch (err) {
    handleError(res, err);
  }
};
