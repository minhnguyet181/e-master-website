// src/routes/learningPath.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('./middlewares/auth.middleware');
const LearningPathController = require('../controllers/learningPath.controller');

router.post('/learning-path/generate', authenticate, LearningPathController.generate);
router.get('/learning-path', authenticate, LearningPathController.getActive);
router.post('/learning-path/:id/milestones/complete', authenticate, LearningPathController.completeMilestone);
router.get('/learning-path/recommendations', authenticate, LearningPathController.getRecommendations);

module.exports = router;

