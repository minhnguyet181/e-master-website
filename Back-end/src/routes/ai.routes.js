// src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const AIController = require('../controllers/ai.controller');
const authenticate = require('./middlewares/auth.middleware');
const requireAdmin = require('./middlewares/admin.middleware');
const { createRateLimiter, userOrIpKey } = require('./middlewares/rateLimit.middleware');

const aiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX || 40),
  keyFn: userOrIpKey,
});

router.post('/grade-writing', authenticate, aiLimiter, AIController.gradeWriting);
router.post('/grade-speaking', authenticate, aiLimiter, AIController.gradeSpeaking);
router.post('/chat', authenticate, aiLimiter, AIController.chat);
// FE calls /ai/chat — alias
router.post('/ai/chat', authenticate, aiLimiter, AIController.chat);

// Admin-only: expose AI config status (no secrets)
router.get('/ai/config', authenticate, requireAdmin, AIController.getAIConfig);

module.exports = router;
