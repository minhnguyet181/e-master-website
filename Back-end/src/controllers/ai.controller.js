// src/controllers/ai.controller.js
const AIService = require('../services/ai.service');
const { handleResponse, handleError } = require('./base.controller');

exports.gradeWriting = async (req, res) => {
  try {
    const result = await AIService.gradeWriting(req.body.essay);
    let payload = result;
    if (typeof result === 'string') {
      try { payload = JSON.parse(result); } catch (e) { payload = { raw: result }; }
    }
    handleResponse(res, payload, 'Writing graded successfully');
  } catch (err) {
    handleError(res, err);
  }
};

exports.gradeSpeaking = async (req, res) => {
  try {
    const result = await AIService.gradeSpeaking(req.body.transcript);
    let payload = result;
    if (typeof result === 'string') {
      try { payload = JSON.parse(result); } catch (e) { payload = { raw: result }; }
    }
    handleResponse(res, payload, 'Speaking graded successfully');
  } catch (err) {
    handleError(res, err);
  }
};

// Generic chat endpoint used by FE assistant box
exports.chat = async (req, res) => {
  try {
    const message = req.body?.message || req.query?.message || '';
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const result = await AIService.chatAssistant(message);
    // chatAssistant returns raw text
    handleResponse(res, { text: result }, 'Chat response');
  } catch (err) {
    handleError(res, err);
  }
};
