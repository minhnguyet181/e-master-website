// src/controllers/learningPath.controller.js
const LearningPathService = require('../services/learningPath.service');
const { handleResponse, handleError } = require('./base.controller');

exports.generate = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await LearningPathService.generateLearningPathFromBands(userId);
    if (!result.success) return res.status(400).json(result);
    return handleResponse(res, result, 'Learning path generated');
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getActive = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await LearningPathService.getLearningPath(userId);
    if (!result.success) return res.status(404).json(result);
    return handleResponse(res, result, 'Learning path');
  } catch (err) {
    return handleError(res, err);
  }
};

exports.completeMilestone = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const learningPathId = Number(req.params.id);
    const milestoneIndex = Number(req.body?.milestone_index);
    if (!Number.isFinite(learningPathId)) return res.status(400).json({ success: false, message: 'Invalid learning path id' });
    if (!Number.isFinite(milestoneIndex)) return res.status(400).json({ success: false, message: 'milestone_index is required' });

    const progress = await LearningPathService.completeMilestone({ userId, learningPathId, milestoneIndex });
    return handleResponse(res, progress, 'Milestone completed');
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const result = await LearningPathService.getRecommendationsForCurrentMilestone(userId);
    if (!result.success) return res.status(404).json(result);
    return handleResponse(res, result, 'Recommendations');
  } catch (err) {
    return handleError(res, err);
  }
};

