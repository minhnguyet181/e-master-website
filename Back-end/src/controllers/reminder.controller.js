// src/controllers/reminder.controller.js
const ReminderService = require('../services/reminder.service');
const User = require('../models/user.model');
const { handleResponse, handleError } = require('./base.controller');

exports.weeklyReminder = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const msg = await ReminderService.checkWeeklyReminder(user);
    handleResponse(res, { message: msg });
  } catch (err) {
    handleError(res, err);
  }
};
