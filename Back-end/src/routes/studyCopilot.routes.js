const express = require('express');
const router = express.Router();
const auth = require('./middlewares/auth.middleware');
const StudyCopilotController = require('../controllers/studyCopilot.controller');

router.get('/copilot/insights', auth, StudyCopilotController.getInsights);

module.exports = router;
