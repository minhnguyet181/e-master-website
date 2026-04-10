// src/controllers/user.controller.js
const UserService = require('../services/user.service');
const AIService = require('../services/ai.service');
const ResourceService = require('../services/resource.service');
const { getBandBucket, representativeBandForBucket } = require('../utils/studyPlanUtils');
const { handleResponse, handleError } = require('./base.controller');
const UserCourse = require('../models/userCourse.model');
const User = require('../models/user.model');
exports.getProfile = async (req, res) => {
  try {
    const user = await UserService.getProfile(req.user.id);
    handleResponse(res, user);
  } catch (err) {
    handleError(res, err);
  }
};

// Get user's enrolled courses
exports.getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await UserCourse.findAll({ where: { user_id: userId } });
    handleResponse(res, { courses }, 'User courses retrieved');
  } catch (err) {
    handleError(res, err);
  }
};

// Get specific user course
exports.getUserCourseById = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = parseInt(req.params.id, 10);

    const course = await UserCourse.findOne({ where: { id: courseId, user_id: userId } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    handleResponse(res, { course }, 'User course retrieved');
  } catch (err) {
    handleError(res, err);
  }
};

// Return saved AI recommendation for user (if any)
exports.getAIRecommendation = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const raw = user.ai_recommendation || null;
    let parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
    }
    handleResponse(res, { ai_recommendation: parsed }, 'AI recommendation');
  } catch (err) {
    handleError(res, err);
  }
};

// Update AI recommendation for user
exports.updateAIRecommendation = async (req, res) => {
  try {
    const { recommendation } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const value = typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation);
    await user.update({ ai_recommendation: value });
    handleResponse(res, { ai_recommendation: recommendation }, 'AI recommendation updated');
  } catch (err) {
    handleError(res, err);
  }
};

// Get recommended resources based on user's band (without AI generation)
exports.getRecommendedResources = async (req, res) => {
  try {
    const user = await UserService.getProfile(req.user.id);
    
    // Use user's target or current band
    const band = user.band_target || user.current_band;
    
    let resources = { success: false, resources: [] };
    try {
      if (band) {
        resources = await ResourceService.getResourcesByBand({ band }, 10, 0);
      } else {
        resources = await ResourceService.getResourcesForUser(req.user.id, { useTargetBand: true }, 10);
      }
    } catch (e) {
      console.warn('⚠️ Failed to fetch resources:', e.message);
    }

    const responsePayload = {
      success: true,
      user_band: band,
      resources: resources.resources || [],
      resources_meta: {
        total: resources.total || (resources.resources ? resources.resources.length : 0),
        filter_applied: resources.filter_applied || {}
      }
    };

    return handleResponse(res, responsePayload, 'Recommended resources retrieved');
  } catch (err) {
    console.error('❌ getRecommendedResources error:', err.message);
    handleError(res, err);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await UserService.updateProfile(req.user.id, req.body);
    handleResponse(res, user, 'Profile updated successfully');
  } catch (err) {
    handleError(res, err);
  }
};

// Gửi thông tin học tập lên AI để tạo lộ trình
exports.generateLearningPlan = async (req, res) => {
  try {
    const user = await UserService.getProfile(req.user.id);

    const aiPlan = await AIService.generateLearningPlan({
      goal: user.goal,
      band_target: user.band_target,
      study_hours_per_day: user.study_hours_per_day,
      reason: user.reason,
    });

    await UserService.saveAIRecommendation(user.id, aiPlan);
    handleResponse(res, aiPlan, 'AI learning plan generated');
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * Tìm kiếm users theo band
 * GET /e-master/user/search-by-band?band=5&bandType=current&exactMatch=false&limit=20&offset=0
 */
exports.searchUsersByBand = async (req, res) => {
  try {
    const {
      band,
      bandType = 'both', // 'current', 'target', or 'both'
      exactMatch = 'false',
      limit = 50,
      offset = 0
    } = req.query;

    if (!band) {
      return res.status(400).json({
        success: false,
        error: 'Band parameter is required'
      });
    }

    const result = await UserService.searchUsersByBand(
      {
        band,
        bandType,
        exactMatch: exactMatch === 'true'
      },
      parseInt(limit),
      parseInt(offset)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in searchUsersByBand:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Tìm kiếm users trong khoảng band
 * GET /e-master/user/search-by-band-range?minBand=5&maxBand=6&bandType=both&limit=20&offset=0
 */
exports.searchUsersByBandRange = async (req, res) => {
  try {
    const {
      minBand,
      maxBand,
      bandType = 'both',
      limit = 50,
      offset = 0
    } = req.query;

    if (!minBand || !maxBand) {
      return res.status(400).json({
        success: false,
        error: 'minBand and maxBand parameters are required'
      });
    }

    const result = await UserService.searchUsersByBandRange(
      {
        minBand,
        maxBand,
        bandType
      },
      parseInt(limit),
      parseInt(offset)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in searchUsersByBandRange:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.generateLearningPath = async (req, res) => {
  try {
    const LearningPathService = require('../services/learningPath.service');
    const result = await LearningPathService.generateLearningPathFromBands(req.user.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in generateLearningPath:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get learning path của user
 * GET /e-master/user/learning-path
 */
exports.getLearningPath = async (req, res) => {
  try {
    const LearningPathService = require('../services/learningPath.service');
    const result = await LearningPathService.getLearningPath(req.user.id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in getLearningPath:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
