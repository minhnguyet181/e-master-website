// src/routes/dailyPlan.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('./middlewares/auth.middleware');
const DailyPlanController = require('../controllers/dailyPlan.controller');

router.get('/daily-plan/today', authenticate, DailyPlanController.getToday);
router.post('/daily-plan/complete', authenticate, DailyPlanController.completeTask);
router.get('/daily-plan/streak', authenticate, DailyPlanController.getStreak);

module.exports = router;

