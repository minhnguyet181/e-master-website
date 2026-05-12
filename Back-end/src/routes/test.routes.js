// src/routes/test.routes.js
const express = require('express');
const router = express.Router();
const TestController = require('../controllers/test.controller');
const authenticate = require('./middlewares/auth.middleware');
const { createRateLimiter, userOrIpKey } = require('./middlewares/rateLimit.middleware');

const gradeLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.GRADING_RATE_LIMIT_MAX || 30),
  keyFn: userOrIpKey,
});

router.get('/test', authenticate, TestController.getAll);
router.get('/test/skill/:skill', authenticate, TestController.getBySkill);
router.get('/test/:id', authenticate, TestController.getById);
router.get('/test/:id/correct-answers', authenticate, TestController.getCorrectAnswers);
// Legacy FE path
router.get('/test/:id/answers', authenticate, TestController.getCorrectAnswers);
router.get('/test/:id/test', authenticate, TestController.getTestWithQuestions);
router.post('/test/grade', authenticate, gradeLimiter, TestController.gradeTest);
router.get('/test/grade/jobs/:jobId', authenticate, TestController.getGradeJobStatus);

module.exports = router;
