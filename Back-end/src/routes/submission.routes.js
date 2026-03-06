// src/routes/submission.routes.js
const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/submission.controller');
const authenticate = require('./middlewares/auth.middleware');

router.post('/reading', authenticate, SubmissionController.submitReadingListening);
router.post('/listening', authenticate, SubmissionController.submitReadingListening);

router.post('/writing', authenticate, SubmissionController.submitWriting);
router.post('/speaking', authenticate, SubmissionController.submitSpeaking);

module.exports = router;
