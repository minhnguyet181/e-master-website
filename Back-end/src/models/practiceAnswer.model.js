// src/models/practiceAnswer.model.js
/**
 * PracticeAnswer Model - Đáp án và giải thích
 * 
 * Lưu trữ đáp án và giải thích chi tiết cho practice materials
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class PracticeAnswer extends Model {}

PracticeAnswer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID của practice material'
    },

    answer_key: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Đáp án đầy đủ. Format: {1: "A", 2: "B", 3: "C", ...}'
    },

    detailed_explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Giải thích chi tiết cho tất cả đáp án'
    },

    scoring_guide: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Hướng dẫn chấm điểm. Format: {total_points: 40, passing_score: 24, ...}'
    }
  },
  {
    sequelize,
    modelName: 'PracticeAnswer',
    tableName: 'practice_answers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['material_id'] },
      // Unique constraint: một material chỉ có một answer key
      {
        unique: true,
        fields: ['material_id'],
        name: 'unique_material_answer'
      }
    ]
  }
);

module.exports = PracticeAnswer;

