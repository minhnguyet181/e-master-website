// src/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const AIController = require('../controllers/ai.controller');
const authenticate = require('./middlewares/auth.middleware');

router.post('/grade-writing', authenticate, AIController.gradeWriting);
router.post('/grade-speaking', authenticate, AIController.gradeSpeaking);
router.post('/chat', authenticate, AIController.chat);

module.exports = router;
