// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const authenticate = require('./middlewares/auth.middleware');

router.get('/user/profile', authenticate, UserController.getProfile);
router.put('/user/update-profile', authenticate, UserController.updateProfile);
router.post('/user/generate-plan', authenticate, UserController.generateLearningPlan);
router.get('/user/recommended-resources', authenticate, UserController.getRecommendedResources);
router.get('/user/courses', authenticate, UserController.getUserCourses);
router.get('/user/courses/:id', authenticate, UserController.getUserCourseById);
router.get('/user/ai-recommendation', authenticate, UserController.getAIRecommendation);
router.put('/user/ai-recommendation', authenticate, UserController.updateAIRecommendation);

// Learning path endpoints
router.post('/generate-learning-path', authenticate, UserController.generateLearningPath);
router.get('/learning-path', authenticate, UserController.getLearningPath);

// Search users by band (public endpoints for admin/search purposes)
/**
 * {
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "current_band": "Band 5.0",
      "band_target": "Band 7.0",
      "goal": "Study abroad",
      "study_hours_per_day": 2
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0,
  "hasMore": false,
  "filters": {
    "band": "5",
    "bandType": "both",
    "exactMatch": false
  }
}
 */
router.get('/search-by-band', UserController.searchUsersByBand);
router.get('/search-by-band-range', UserController.searchUsersByBandRange);

module.exports = router;
