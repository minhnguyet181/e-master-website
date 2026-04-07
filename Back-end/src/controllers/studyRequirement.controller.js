// src/controllers/studyRequirement.controller.js
const StudyRequirementService = require('../services/studyRequirement.service');
const { handleResponse, handleError } = require('./base.controller');

exports.getUserStudyRequirements = async (req, res) => {
  try {
    const result = await StudyRequirementService.getUserStudyRequirements(req.user.id);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

exports.calculateStudyRequirements = async (req, res) => {
  try {
    const { current_band, target_band, study_hours_per_week } = req.body;
    if (!current_band || !target_band) {
      return res.status(400).json({ success: false, error: 'current_band and target_band are required' });
    }

    const result = StudyRequirementService.calculateStudyRequirements(
      current_band, target_band, study_hours_per_week
    );
    return res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
};
