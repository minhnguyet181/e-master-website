// src/controllers/placementTest.controller.js
const PlacementTestService = require('../services/placementTest.service');
const { handleResponse, handleError } = require('./base.controller');

exports.submitPlacementTest = async (req, res) => {
  try {
    const { answers, scores } = req.body;
    if (!answers) {
      return res.status(400).json({ success: false, error: 'Answers are required' });
    }

    const result = await PlacementTestService.submitPlacementTest(req.user.id, { answers, scores });

    if (!result.success) return res.status(400).json(result);

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
        study_recommendations: result.placement_test.study_recommendations,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getPlacementResult = async (req, res) => {
  try {
    const result = await PlacementTestService.getPlacementResult(req.user.id);
    if (!result.success) return res.status(404).json(result);

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
        completed_at: result.result.completed_at,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
};
