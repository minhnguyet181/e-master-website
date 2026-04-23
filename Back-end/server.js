const path = require('path');
// Luôn đọc .env trong thư mục Back-end (tránh mất GEMINI_API_KEY khi chạy node từ thư mục khác)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db');
const routes = require('./src/routes');
const { applyTestV2Associations } = require('./src/models/testV2.associations');
const { isQueueEnabled, registerWorkers, getQueues } = require('./src/services/queue.service');
const { processGradingJob, processBookImportJob } = require('./src/services/jobProcessor.service');

const app = express();

const corsAllowed = new Set(
  [
    process.env.FRONTEND_URL,
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

app.use('/e-master', routes);

// Health check endpoint for Docker/load balancer
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Apply associations once at boot (doesn't hit DB)
applyTestV2Associations();

const shouldSync = String(process.env.DB_SYNC || '').toLowerCase() === 'true';

const _gk = String(process.env.GEMINI_API_KEY || '').trim().replace(/^\uFEFF/, '');
if (_gk) {
  console.log(
    `🔑 GEMINI_API_KEY loaded (len=${_gk.length}, prefix=${_gk.slice(0, 4)}…, starts AIza=${_gk.startsWith('AIza')})`
  );
} else {
  console.warn('⚠️ GEMINI_API_KEY missing — AI onboarding / grading will fail until set in Back-end/.env');
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
    console.error('❌ DB connection failed:', err);
  }
};

startServer();
