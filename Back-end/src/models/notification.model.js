// src/models/notification.model.js
/**
 * Notification Model - Thông báo cho user
 * 
 * Lưu trữ các thông báo hệ thống gửi cho user
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user nhận thông báo'
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Tiêu đề thông báo'
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nội dung thông báo'
    },

    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Đã đọc chưa'
    }
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Schema chỉ có created_at
    indexes: [
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] }
    ]
  }
);

module.exports = Notification;

