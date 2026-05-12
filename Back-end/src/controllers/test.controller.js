const TestService = require('../services/test.service');
const { handleResponse, handleError } = require('./base.controller');
const { gradeTestAttempt } = require('../services/grading.service');
const ProgressService = require('../services/progress.service');
const { sendEvent } = require('../services/sse.service');
const { isQueueEnabled, getQueues } = require('../services/queue.service');

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

    if (isQueueEnabled) {
      const { gradingQueue } = getQueues() || {};
      if (!gradingQueue) {
        return res.status(503).json({ success: false, message: 'Grading queue unavailable' });
      }

      const job = await gradingQueue.add(
        'grade-test-attempt',
        {
          userId,
          testId,
          answers,
          rubricVer: req.body.rubric_ver || 'v1',
          aiProvider: req.body.ai_provider || 'gemini',
        },
        {
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 7 * 24 * 3600, count: 1000 },
        }
      );

      sendEvent(userId, 'grading_queued', { test_id: testId, job_id: job.id, ts: Date.now() });
      return res.status(202).json({
        success: true,
        message: 'Grading has been queued',
        job_id: job.id,
      });
    }

    // Fallback synchronous grading when queue is disabled.
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
      progress = await ProgressService.recordTestDone(userId, testId, attempt.id, attempt.score_numeric);
      sendEvent(userId, 'progress_updated', {
        completed: progress.tasks_completed,
        total: progress.tasks_total,
        completion_rate: progress.completion_rate,
      });
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

exports.getGradeJobStatus = async (req, res) => {
  try {
    if (!isQueueEnabled) {
      return res.status(400).json({ success: false, message: 'Queue mode is disabled. Set QUEUE_ENABLED=true.' });
    }
    const { gradingQueue } = getQueues() || {};
    if (!gradingQueue) return res.status(503).json({ success: false, message: 'Grading queue unavailable' });

    const job = await gradingQueue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const state = await job.getState();

    return res.status(200).json({
      success: true,
      job_id: job.id,
      state,
      progress: job.progress || null,
      result: job.returnvalue || null,
      failed_reason: job.failedReason || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
