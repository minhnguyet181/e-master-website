// src/models/aiRecommendation.model.js
/**
 * AIRecommendation Model - Gợi ý từ AI cho user
 * 
 * Lưu trữ các gợi ý được AI tạo ra dựa trên phân tích
 * hiệu suất và mục tiêu của user
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class AIRecommendation extends Model {}

AIRecommendation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user nhận gợi ý'
    },

    recommendation_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Loại gợi ý: study_plan, resource, practice_test, etc.'
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nội dung gợi ý chi tiết'
    },

    score: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      comment: 'Điểm độ phù hợp của gợi ý (0.0 - 1.0)'
    }
  },
  {
    sequelize,
    modelName: 'AIRecommendation',
    tableName: 'ai_recommendations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['recommendation_type'] }
    ]
  }
);

module.exports = AIRecommendation;

