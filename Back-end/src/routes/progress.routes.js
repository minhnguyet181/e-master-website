// src/routes/progress.routes.js
const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/progress.controller');
const authenticate = require('./middlewares/auth.middleware');

router.get('/progress', authenticate, ProgressController.getProgress);
router.get('/progress/weekly', authenticate, ProgressController.getWeeklyTasks);
// Support both PUT and POST for update (FE uses POST)
router.put('/progress/update', authenticate, ProgressController.updateProgress);
router.post('/progress/update', authenticate, ProgressController.updateProgress);
router.post('/reset-weekly', authenticate, ProgressController.resetWeekly);

module.exports = router;
