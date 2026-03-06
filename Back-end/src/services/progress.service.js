// src/services/progress.service.js
const Progress = require('../models/progress.model');

class ProgressService {

  static async getUserProgress(userId) {
    return await Progress.findAll({ where: { user_id: userId } });
  }

  static async updateProgress(userId, type, increment = 1) {
    let prog = await Progress.findOne({ where: { user_id: userId, type } });

    if (!prog) {
      prog = await Progress.create({
        user_id: userId,
        type,
        total: 10,
        completed: 0,
      });
    }

    prog.completed += increment;
    await prog.save();

    return prog;
  }

  static async resetWeeklyProgress(userId) {
    const list = await Progress.findAll({ where: { user_id: userId } });

    for (const prog of list) {
      prog.completed = 0;
      await prog.save();
    }

    return list;
  }
}

module.exports = ProgressService;
