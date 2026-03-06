// src/routes/test.routes.js
const express = require('express');
const router = express.Router();
const TestController = require('../controllers/test.controller');
const authenticate = require('./middlewares/auth.middleware');

router.get('/test', authenticate, TestController.getAll);
router.get('/test/skill/:skill', authenticate, TestController.getBySkill);
router.get('/test/:id', authenticate, TestController.getById);
router.get('/test/:id/correct-answers', authenticate, TestController.getCorrectAnswers);
router.get('/test/:id/test', authenticate, TestController.getTestWithQuestions);

module.exports = router;
