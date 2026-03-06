// src/controllers/studyRequirement.controller.js
/**
 * Study Requirement Controller - Tính yêu cầu thời gian học
 */

const StudyRequirementService = require('../services/studyRequirement.service');
const { handleResponse, handleError } = require('./base.controller');
const jwt = require('jsonwebtoken');

/**
 * Get study requirements for current user
 * GET /e-master/study-requirements
 */
exports.getUserStudyRequirements = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const result = await StudyRequirementService.getUserStudyRequirements(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error in getUserStudyRequirements:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Calculate study requirements with custom bands
 * POST /e-master/study-requirements/calculate
 * 
 * Request body:
 * {
 *   "current_band": "Band 5.0",
 *   "target_band": "Band 7.0",
 *   "study_hours_per_week": 10 // optional
 * }
 */
exports.calculateStudyRequirements = async (req, res) => {
  try {
    const { current_band, target_band, study_hours_per_week } = req.body;

    if (!current_band || !target_band) {
      return res.status(400).json({
        success: false,
        error: 'current_band and target_band are required'
      });
    }

    const result = StudyRequirementService.calculateStudyRequirements(
      current_band,
      target_band,
      study_hours_per_week
    );

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

