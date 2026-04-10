// src/services/progress.service.js
// Dùng WeeklyProgress thay cho bảng progress cũ
const WeeklyProgress = require('../models/weeklyProgress.model');

function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

function getWeekStartDate() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

class ProgressService {

  static async getUserProgress(userId) {
    const week = getCurrentWeekNumber();
    const rows = await WeeklyProgress.findAll({ where: { user_id: userId, week_number: week } });
    // Normalize to old shape so callers don't break
    return rows.map(r => ({
      type: `week_${r.week_number}`,
      total: r.tasks_total,
      completed: r.tasks_completed,
      completion_rate: r.completion_rate,
      progress: r.tasks_total > 0 ? Math.round((r.tasks_completed / r.tasks_total) * 100) : 0,
    }));
  }

  static async updateProgress(userId, type, increment = 1) {
    const week = getCurrentWeekNumber();
    const weekStart = getWeekStartDate();

    let row = await WeeklyProgress.findOne({ where: { user_id: userId, week_number: week } });

    if (!row) {
      row = await WeeklyProgress.create({
        user_id: userId,
        week_number: week,
        week_start_date: weekStart,
        tasks_total: 10,
        tasks_completed: 0,
        completion_rate: 0,
      });
    }

    row.tasks_completed = Math.min(row.tasks_completed + increment, row.tasks_total);
    row.completion_rate = row.tasks_total > 0
      ? parseFloat((row.tasks_completed / row.tasks_total).toFixed(2))
      : 0;
    await row.save();

    return {
      type,
      total: row.tasks_total,
      completed: row.tasks_completed,
      progress: Math.round(row.completion_rate * 100),
    };
  }

  static async resetWeeklyProgress(userId) {
    const week = getCurrentWeekNumber();
    const row = await WeeklyProgress.findOne({ where: { user_id: userId, week_number: week } });
    if (row) {
      row.tasks_completed = 0;
      row.completion_rate = 0;
      await row.save();
    }
    return row;
  }

  static async getWeeklyTasks(userId) {
    const week = getCurrentWeekNumber();
    const row = await WeeklyProgress.findOne({ where: { user_id: userId, week_number: week } });
    if (!row) return { tasks: [], completion_rate: 0 };

    return {
      tasks: [
        {
          type: 'weekly',
          total: row.tasks_total,
          completed: row.tasks_completed,
          progress: Math.round(row.completion_rate * 100),
        },
      ],
      completion_rate: row.completion_rate,
      tests_done: row.tests_done || [],
      resources_viewed: row.resources_viewed || [],
    };
  }

  // Ghi nhận test đã làm vào weekly_progress
  static async recordTestDone(userId, testId, attemptId, score) {
    const week = getCurrentWeekNumber();
    const weekStart = getWeekStartDate();

    let row = await WeeklyProgress.findOne({ where: { user_id: userId, week_number: week } });
    if (!row) {
      row = await WeeklyProgress.create({
        user_id: userId,
        week_number: week,
        week_start_date: weekStart,
        tasks_total: 10,
        tasks_completed: 0,
        completion_rate: 0,
        tests_done: [],
      });
    }

    const done = row.tests_done || [];
    // Tránh duplicate
    if (!done.find(t => t.attempt_id === attemptId)) {
      done.push({ test_id: testId, attempt_id: attemptId, score });
      row.tests_done = done;
      row.tasks_completed = Math.min(row.tasks_completed + 1, row.tasks_total);
      row.completion_rate = parseFloat((row.tasks_completed / row.tasks_total).toFixed(2));
      await row.save();
    }
    return row;
  }
}

module.exports = ProgressService;
