// src/controllers/submission.controller.js
const SubmissionService = require('../services/submission.service');
const jwt = require('jsonwebtoken');
const { handleResponse, handleError } = require('./base.controller');

exports.submitReadingListening = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const submission = await SubmissionService.submitReadingListening(decoded.id, req.body.test_id, req.body.answers, req.body.is_correct);
    handleResponse(res, submission, 'Submission recorded');
  } catch (err) {
    handleError(res, err);
  }
};

exports.submitWriting = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const submission = await SubmissionService.submitWriting(decoded.id, req.body.test_id, req.body.essay);
    handleResponse(res, submission, 'Writing graded and saved');
  } catch (err) {
    handleError(res, err);
  }
};

exports.submitSpeaking = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const submission = await SubmissionService.submitSpeaking(decoded.id, req.body.test_id, req.body.transcript);
    handleResponse(res, submission, 'Speaking graded and saved');
  } catch (err) {
    handleError(res, err);
  }
};
