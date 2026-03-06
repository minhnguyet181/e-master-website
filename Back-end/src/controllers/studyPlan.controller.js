// src/controllers/studyPlan.controller.js
const { validatePlanInput, buildAIPrompt } = require('../utils/studyPlanUtils');
const { callOpenAIAPI } = require('../services/openai.service');
const { handleResponse, handleError } = require('./base.controller');

const generateStudyPlan = async (req, res) => {
  try {
    const validation = validatePlanInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const planPrompt = buildAIPrompt(req.body);

    // ===== CALL AI SERVICE =====
    const planText = await callOpenAIAPI(planPrompt, { max_tokens: 1200 });

    // Try to parse JSON result
    let plan;
    try {
      plan = JSON.parse(planText);
    } catch (parseErr) {
      // If the model returned some extra text, try to extract JSON substring
      const start = planText.indexOf('{');
      const end = planText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          plan = JSON.parse(planText.slice(start, end + 1));
        } catch (e) {
          // fallback: return raw text
          return res.status(200).json({ success: true, plan: planText, note: 'returned raw text; failed to parse JSON' });
        }
      } else {
        return res.status(200).json({ success: true, plan: planText, note: 'returned raw text; no JSON found' });
      }
    }

    // Successful JSON response
    return handleResponse(res, plan, 'Study plan generated');
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate study plan',
      error: error.message
    });
  }
};

module.exports = {
  generateStudyPlan
};
