// src/controllers/submission.controller.js
const SubmissionService = require('../services/submission.service');
const { handleResponse, handleError } = require('./base.controller');

exports.submitReadingListening = async (req, res) => {
  try {
    const submission = await SubmissionService.submitReadingListening(
      req.user.id, req.body.test_id, req.body.answers, req.body.is_correct
    );
    handleResponse(res, submission, 'Submission recorded');
  } catch (err) {
    handleError(res, err);
  }
};

exports.submitWriting = async (req, res) => {
  try {
    const submission = await SubmissionService.submitWriting(
      req.user.id, req.body.test_id, req.body.essay
    );
    handleResponse(res, submission, 'Writing graded and saved');
  } catch (err) {
    handleError(res, err);
  }
};

exports.submitSpeaking = async (req, res) => {
  try {
    const submission = await SubmissionService.submitSpeaking(
      req.user.id, req.body.test_id, req.body.transcript
    );
    handleResponse(res, submission, 'Speaking graded and saved');
  } catch (err) {
    handleError(res, err);
  }
};
