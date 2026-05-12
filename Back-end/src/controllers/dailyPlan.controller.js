// src/controllers/dailyPlan.controller.js
const DailyPlanService = require('../services/dailyPlan.service');
const { handleResponse, handleError } = require('./base.controller');

exports.getToday = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const row = await DailyPlanService.getOrCreateTodayPlan(userId);
    return handleResponse(res, row, 'Daily plan');
  } catch (err) {
    return handleError(res, err);
  }
};

exports.completeTask = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { task_id, plan_date } = req.body || {};
    if (!task_id) return res.status(400).json({ success: false, message: 'task_id is required' });

    const row = await DailyPlanService.completeTask(userId, plan_date, task_id);
    return handleResponse(res, row, 'Task completed');
  } catch (err) {
    return handleError(res, err);
  }
};

exports.getStreak = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const summary = await DailyPlanService.getStreakSummary(userId);
    return handleResponse(res, summary, 'Streak');
  } catch (err) {
    return handleError(res, err);
  }
};

