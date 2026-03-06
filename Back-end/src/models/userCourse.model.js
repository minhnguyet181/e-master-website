// src/models/userCourse.model.js
/**
 * UserCourse Model - Khóa học của user
 * 
 * Lưu trữ thông tin các khóa học mà user đã đăng ký
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserCourse extends Model {}

UserCourse.init(
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

    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tiến độ hoàn thành (0-100)'
    },

    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'in_progress',
      comment: 'Trạng thái: in_progress, completed, cancelled'
    }
  },
  {
    sequelize,
    modelName: 'UserCourse',
    tableName: 'user_courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['course_id'] },
      { fields: ['status'] }
    ]
  }
);

module.exports = UserCourse;

