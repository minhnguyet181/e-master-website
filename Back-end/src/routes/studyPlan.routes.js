// src/routes/studyPlan.routes.js
const express = require('express');
const router = express.Router();
const StudyPlanController = require('../controllers/studyPlan.controller');
const authenticate = require('./middlewares/auth.middleware');

router.post('/ai/study-plan', authenticate, StudyPlanController.generateStudyPlan);

module.exports = router;
