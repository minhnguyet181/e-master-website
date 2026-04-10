// src/controllers/progress.controller.js
const ProgressService = require('../services/progress.service');
const { handleResponse, handleError } = require('./base.controller');

exports.getProgress = async (req, res) => {
  try {
    const progress = await ProgressService.getUserProgress(req.user.id);
    handleResponse(res, progress);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const progress = await ProgressService.updateProgress(req.user.id, req.body.type, req.body.increment);
    handleResponse(res, progress, 'Progress updated');
  } catch (err) {
    handleError(res, err);
  }
};

exports.resetWeekly = async (req, res) => {
  try {
    const result = await ProgressService.resetWeeklyProgress(req.user.id);
    handleResponse(res, result, 'Weekly progress reset');
  } catch (err) {
    handleError(res, err);
  }
};

exports.getWeeklyTasks = async (req, res) => {
  try {
    const tasks = await ProgressService.getWeeklyTasks(req.user.id);
    handleResponse(res, tasks, 'Weekly tasks retrieved');
  } catch (err) {
    handleError(res, err);
  }
};
