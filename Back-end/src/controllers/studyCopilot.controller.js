const { getCopilotInsights } = require('../services/studyCopilot.service');
const { handleError } = require('./base.controller');

exports.getInsights = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const data = await getCopilotInsights(userId);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
