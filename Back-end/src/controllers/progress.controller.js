// src/controllers/progress.controller.js
const ProgressService = require('../services/progress.service');
const { handleResponse, handleError } = require('./base.controller');
const jwt = require('jsonwebtoken');

exports.getProgress = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const progress = await ProgressService.getUserProgress(decoded.id);
    handleResponse(res, progress);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const progress = await ProgressService.updateProgress(decoded.id, req.body.type, req.body.increment);
    handleResponse(res, progress, 'Progress updated');
  } catch (err) {
    handleError(res, err);
  }
};

exports.resetWeekly = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await ProgressService.resetWeeklyProgress(decoded.id);
    handleResponse(res, result, 'Weekly progress reset');
  } catch (err) {
    handleError(res, err);
  }
};
