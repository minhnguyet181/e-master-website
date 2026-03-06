// src/models/goal.model.js
/**
 * Goal Model - Mục tiêu học tập của user
 * 
 * Lưu trữ các mục tiêu học tập mà user đặt ra
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Goal extends Model {}

Goal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user sở hữu mục tiêu này'
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Tiêu đề mục tiêu'
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả chi tiết mục tiêu'
    },

    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày mục tiêu cần đạt được'
    },

    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tiến độ hoàn thành (0-100)'
    },

    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      comment: 'Trạng thái: pending, in_progress, completed, cancelled'
    }
  },
  {
    sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] }
    ]
  }
);

module.exports = Goal;

