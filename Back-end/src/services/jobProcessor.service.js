const { gradeTestAttempt } = require('./grading.service');
const ProgressService = require('./progress.service');
const { sendEvent } = require('./sse.service');
const { processBookImport } = require('../controllers/bookImport.controller');

async function processGradingJob(job) {
  const { userId, testId, answers, rubricVer, aiProvider } = job.data;
  sendEvent(userId, 'grading_started', { test_id: testId, ts: Date.now() });

  const { attempt, result, cacheHit } = await gradeTestAttempt({
    userId,
    testId,
    answers,
    rubricVer: rubricVer || 'v1',
    aiProvider: aiProvider || 'gemini',
  });

  let progress;
  try {
    progress = await ProgressService.recordTestDone(userId, testId, attempt.id, attempt.score_numeric);
    sendEvent(userId, 'progress_updated', {
      completed: progress.tasks_completed,
      total: progress.tasks_total,
      completion_rate: progress.completion_rate,
    });
  } catch (error) {
    // Ignore progress update failures to avoid failing the grading job.
  }

  sendEvent(userId, 'grading_done', { attempt_id: attempt.id, test_id: testId, cache_hit: cacheHit, result });
  return { attempt_id: attempt.id, cache_hit: cacheHit, result, progress };
}

async function processBookImportJob(job) {
  const { pdfBase64, audioZipBase64, options = {} } = job.data;
  const result = await processBookImport({
    pdfBuffer: Buffer.from(pdfBase64, 'base64'),
    audioZipBuffer: audioZipBase64 ? Buffer.from(audioZipBase64, 'base64') : null,
    bookName: options.bookName,
    examType: options.examType,
    skills: options.skills,
    onProgress: async (payload) => {
      await job.updateProgress(payload);
    },
  });
  return result;
}

module.exports = {
  processGradingJob,
  processBookImportJob,
};
