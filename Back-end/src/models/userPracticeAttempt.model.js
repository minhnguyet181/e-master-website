// src/models/userPracticeAttempt.model.js
/**
 * UserPracticeAttempt Model - Tracking user attempts
 * 
 * Lưu trữ các lần làm bài practice của user
 * Bao gồm kết quả, phân tích và AI feedback
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserPracticeAttempt extends Model {}

UserPracticeAttempt.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của user làm bài'
    },

    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của practice material'
    },

    // Submission
    answers: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Câu trả lời của user. Format: {1: "A", 2: "B", ...}'
    },

    score: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      comment: 'Điểm số đạt được'
    },

    time_spent_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thời gian làm bài (phút)'
    },

    // Analysis
    correct_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số câu đúng'
    },

    incorrect_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số câu sai'
    },

    skipped_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số câu bỏ qua'
    },

    accuracy_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Tỷ lệ chính xác (0.00 - 100.00)'
    },

    // AI Feedback
    ai_feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Feedback từ AI'
    },

    weak_areas: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Các lĩnh vực yếu. Format: ["vocabulary", "grammar"]'
    },

    strong_areas: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Các lĩnh vực mạnh. Format: ["reading_comprehension"]'
    },

    recommendations: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Gợi ý cải thiện. Format: ["Practice more vocabulary", "Focus on grammar"]'
    },

    // Timestamps
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời điểm bắt đầu làm bài'
    },

    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      comment: 'Thời điểm nộp bài'
    }
  },
  {
    sequelize,
    modelName: 'UserPracticeAttempt',
    tableName: 'user_practice_attempts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['material_id'] },
      { fields: ['submitted_at'] }
    ]
  }
);

module.exports = UserPracticeAttempt;

