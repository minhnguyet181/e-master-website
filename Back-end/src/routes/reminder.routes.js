// src/routes/reminder.routes.js
const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/reminder.controller');
const authenticate = require('./middlewares/auth.middleware');

router.get('/weekly', authenticate, ReminderController.weeklyReminder);

module.exports = router;
