// src/controllers/reminder.controller.js
const ReminderService = require('../services/reminder.service');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { handleResponse, handleError } = require('./base.controller');

exports.weeklyReminder = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    const msg = await ReminderService.checkWeeklyReminder(user);
    handleResponse(res, { message: msg });
  } catch (err) {
    handleError(res, err);
  }
};