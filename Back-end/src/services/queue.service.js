const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const isQueueEnabled = String(process.env.QUEUE_ENABLED || '').toLowerCase() === 'true';
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let connection = null;
let gradingQueue = null;
let bookImportQueue = null;
let gradingWorker = null;
let bookImportWorker = null;

function getConnection() {
  if (!connection) {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return connection;
}

function ensureQueues() {
  if (!isQueueEnabled) return null;
  if (!gradingQueue || !bookImportQueue) {
    const conn = getConnection();
    gradingQueue = new Queue('grading-jobs', { connection: conn });
    bookImportQueue = new Queue('book-import-jobs', { connection: conn });
  }
  return { gradingQueue, bookImportQueue };
}

function getQueues() {
  return ensureQueues();
}

function registerWorkers({ processGradingJob, processBookImportJob }) {
  if (!isQueueEnabled) return null;
  const conn = getConnection();

  if (!gradingWorker) {
    gradingWorker = new Worker(
      'grading-jobs',
      async (job) => processGradingJob(job),
      { connection: conn, concurrency: Number(process.env.GRADING_QUEUE_CONCURRENCY || 2) }
    );
  }

  if (!bookImportWorker) {
    bookImportWorker = new Worker(
      'book-import-jobs',
      async (job) => processBookImportJob(job),
      { connection: conn, concurrency: Number(process.env.IMPORT_QUEUE_CONCURRENCY || 1) }
    );
  }

  return { gradingWorker, bookImportWorker };
}

module.exports = {
  isQueueEnabled,
  getQueues,
  registerWorkers,
};
