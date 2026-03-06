// src/services/reminder.service.js
const User = require('../models/user.model');
const ProgressService = require('./progress.service');

class ReminderService {

  static async checkWeeklyReminder(user) {
    const progress = await ProgressService.getUserProgress(user.id);

    const incomplete = progress.filter(p => p.completed < p.total);

    if (incomplete.length === 0) {
      return "✅ Great job! You completed your weekly goals!";
    }

    return `📌 You still have ${incomplete.length} learning tasks to finish this week. Keep going!`;
  }
}

module.exports = ReminderService;
