// src/controllers/placementTest.controller.js
/**
 * Placement Test Controller
 * 
 * Endpoints:
 * - POST /placement-test/submit - Submit placement test, AI phân loại band
 * - GET /placement-test/result - Get placement test result
 */

const PlacementTestService = require('../services/placementTest.service');
const { handleResponse, handleError } = require('./base.controller');
const jwt = require('jsonwebtoken');

/**
 * Submit placement test
 * POST /e-master/placement-test/submit
 * 
 * Request body:
 * {
 *   "answers": [{question_id: 1, answer: "A"}, ...],
 *   "scores": {reading: 5.5, listening: 6.0, writing: 5.0, speaking: 5.5} // optional
 * }
 */
exports.submitPlacementTest = async (req, res) => {
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

    const { answers, scores } = req.body;

    if (!answers) {
      return res.status(400).json({
        success: false,
        error: 'Answers are required'
      });
    }

    console.log(`📝 User ${userId} submitting placement test...`);

    const result = await PlacementTestService.submitPlacementTest(userId, {
      answers,
      scores
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      placement_test: {
        id: result.placement_test.id,
        assessed_band: result.placement_test.assessed_band,
        assessed_level: result.placement_test.assessed_level,
        scores: result.placement_test.scores,
        weak_skills: result.placement_test.weak_skills,
        strong_skills: result.placement_test.strong_skills,
        ai_analysis: result.placement_test.ai_analysis,
        recommended_program: result.placement_test.recommended_program,
        study_recommendations: result.placement_test.study_recommendations
      }
    });

  } catch (error) {
    console.error('❌ Error in submitPlacementTest:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get placement test result
 * GET /e-master/placement-test/result
 */
exports.getPlacementResult = async (req, res) => {
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

    const result = await PlacementTestService.getPlacementResult(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      result: {
        assessed_band: result.result.assessed_band,
        assessed_level: result.result.assessed_level,
        scores: result.result.scores,
        weak_skills: result.result.weak_skills,
        strong_skills: result.result.strong_skills,
        ai_analysis: result.result.ai_analysis,
        recommended_program: result.result.recommended_program,
        study_recommendations: result.result.study_recommendations,
        completed_at: result.result.completed_at
      }
    });

  } catch (error) {
    console.error('❌ Error in getPlacementResult:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

