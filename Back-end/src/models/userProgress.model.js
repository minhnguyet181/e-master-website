// src/models/userProgress.model.js
/**
 * UserProgress Model - Tiến độ học theo khóa học
 * 
 * Lưu trữ tiến độ học tập của user theo từng khóa học
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserProgress extends Model {}

UserProgress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user'
    },

    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của khóa học'
    },

    completed_lessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số bài học đã hoàn thành'
    },

    total_lessons: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tổng số bài học trong khóa'
    },

    completion_rate: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      comment: 'Tỷ lệ hoàn thành (0.0 - 1.0)'
    }
  },
  {
    sequelize,
    modelName: 'UserProgress',
    tableName: 'user_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['course_id'] }
    ]
  }
);

module.exports = UserProgress;

