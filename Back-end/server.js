const path = require('path');
// Luôn đọc .env trong thư mục Back-end (tránh mất GEMINI_API_KEY khi chạy node từ thư mục khác)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const sequelize = require('./src/config/db');
const routes = require('./src/routes');
const { applyTestV2Associations } = require('./src/models/testV2.associations');
const { isQueueEnabled, registerWorkers, getQueues } = require('./src/services/queue.service');
const { processGradingJob, processBookImportJob } = require('./src/services/jobProcessor.service');
const { getGeminiApiVersion } = require('./src/utils/geminiApi');

const app = express();

const corsAllowed = new Set(
  [
    process.env.FRONTEND_URL,
    'https://e-master.id.vn',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ].filter(Boolean).map((o) => o.replace(/\/$/, ''))
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (corsAllowed.has(normalized)) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// Default 100kb is too small for admin import-resource (large PDF-derived content JSON).
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '15mb' }));

// Request id for tracing
app.use((req, res, next) => {
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// Health — path gốc /health; nginx map /e-master/health → /health khi qua frontend container
async function healthHandler(req, res) {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: 'ok', db: 'ok' });
  } catch (e) {
    return res.status(500).json({ status: 'degraded', db: 'fail', message: e.message });
  }
}

function healthAiHandler(req, res) {
  const key = String(process.env.GEMINI_API_KEY || '').trim().replace(/^\uFEFF/, '');
  const model = String(process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim();
  return res.status(200).json({
    status: key ? 'ok' : 'degraded',
    provider: 'gemini',
    gemini_api_key_configured: !!key,
    gemini_model: model,
    gemini_api_version: getGeminiApiVersion(),
  });
}

app.get('/health', healthHandler);
app.get('/health/ai', healthAiHandler);

app.use('/e-master', routes);

// Apply associations once at boot (doesn't hit DB)
applyTestV2Associations();

const shouldSync = String(process.env.DB_SYNC || '').toLowerCase() === 'true';

const _gk = String(process.env.GEMINI_API_KEY || '').trim().replace(/^\uFEFF/, '');
if (_gk) {
  console.log('GEMINI_API_KEY: configured');
} else {
  console.warn('GEMINI_API_KEY missing — AI features need Back-end/.env');
}

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Prefer migrations. Only sync when explicitly enabled.
    if (shouldSync) {
      await sequelize.sync();
      console.log('✅ Database synced (DB_SYNC=true)');
    }

    if (isQueueEnabled) {
      getQueues();
      registerWorkers({ processGradingJob, processBookImportJob });
      console.log('✅ BullMQ workers initialized');
    } else {
      console.log('ℹ️ Queue mode disabled (set QUEUE_ENABLED=true to enable BullMQ)');
    }

    app.listen(1818, () => console.log('🚀 Server running on port 1818'));
  } catch (err) {
    console.error('❌ DB connection failed:', err.message || err);
    process.exit(1);
  }
};

startServer();
