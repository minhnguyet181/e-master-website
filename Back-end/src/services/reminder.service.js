// src/services/reminder.service.js
const WeeklyProgress = require('../models/weeklyProgress.model');
const LearningPathWeek = require('../models/learningPathWeek.model');
const LearningPath = require('../models/learningPath.model');
const Notification = require('../models/notification.model');

function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

class ReminderService {

  static async checkWeeklyReminder(user) {
    const week = getCurrentWeekNumber();
    const row = await WeeklyProgress.findOne({ where: { user_id: user.id, week_number: week } });

    if (!row) return { type: 'no_data', message: '📚 Bắt đầu tuần học mới nào!' };

    const rate = parseFloat(row.completion_rate) || 0;

    // Lấy ngưỡng tối thiểu từ learning path nếu có
    let minRate = 0.5;
    if (row.learning_path_id) {
      const lpWeek = await LearningPathWeek.findOne({
        where: { learning_path_id: row.learning_path_id, week_number: week },
      });
      if (lpWeek) minRate = parseFloat(lpWeek.min_completion_rate) || 0.5;
    }

    if (rate >= 1.0) {
      return { type: 'congrats', message: '🎉 Xuất sắc! Bạn đã hoàn thành 100% mục tiêu tuần này!' };
    }
    if (rate >= minRate) {
      return { type: 'on_track', message: `✅ Tốt lắm! Bạn đã hoàn thành ${Math.round(rate * 100)}% — đang đúng lộ trình.` };
    }
    if (rate >= minRate * 0.5) {
      return { type: 'warning', message: `⚠️ Bạn mới đạt ${Math.round(rate * 100)}% — cần cố gắng thêm để đạt mục tiêu tối thiểu ${Math.round(minRate * 100)}%.` };
    }
    return { type: 'critical', message: `🚨 Bạn chỉ đạt ${Math.round(rate * 100)}% — dưới mức tối thiểu. Hãy dành thêm thời gian học tuần này!` };
  }

  // Gửi notification nhắc nhở và đánh dấu đã gửi
  static async sendWeeklyReminder(userId) {
    const result = await ReminderService.checkWeeklyReminder({ id: userId });
    const week = getCurrentWeekNumber();

    // Tạo notification
    await Notification.create({
      user_id: userId,
      title: 'Nhắc nhở học tập tuần này',
      message: result.message,
      type: result.type === 'congrats' ? 'congrats'
          : result.type === 'critical' ? 'warning'
          : 'reminder',
    });

    // Đánh dấu đã gửi
    await WeeklyProgress.update(
      { reminder_sent: true, reminder_sent_at: new Date() },
      { where: { user_id: userId, week_number: week } }
    );

    return result;
  }
}

module.exports = ReminderService;
