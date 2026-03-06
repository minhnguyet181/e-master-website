const express = require('express');
const router = express.Router();
const placementTestController = require('../controllers/placementTest.controller');
const authMiddleware = require('./middlewares/auth.middleware');

router.post('/placement-test/submit', authMiddleware, placementTestController.submitPlacementTest);
router.get('/placement-test/result', authMiddleware, placementTestController.getPlacementResult);

module.exports = router;

