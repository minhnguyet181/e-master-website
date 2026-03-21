// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const aiRoutes = require('./ai.routes');
const testRoutes = require('./test.routes');
const submissionRoutes = require('./submission.routes');
const progressRoutes = require('./progress.routes');
const eventsRoutes = require('./events.routes');
const reminderRoutes = require('./reminder.routes');
const placementTestRoutes = require('./placementTest.routes');
const resourceRoutes = require('./resource.routes');
const studyRequirementRoutes = require('./studyRequirement.routes');
const studyPlanRoutes = require('./studyPlan.routes');

router.use('/', authRoutes);
router.use('/', userRoutes);
router.use('/', aiRoutes);
router.use('/', testRoutes);
router.use('/', submissionRoutes);
router.use('/', progressRoutes);
router.use('/', eventsRoutes);
router.use('/', reminderRoutes);
router.use('/', placementTestRoutes); 
router.use('/', resourceRoutes); 
router.use('/', studyRequirementRoutes); 
router.use('/', studyPlanRoutes);

router.get('/', (req, res) => res.send('🌍 E-Master API Running!'));

module.exports = router;
