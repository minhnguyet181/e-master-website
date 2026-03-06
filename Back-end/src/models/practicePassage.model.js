// src/models/practicePassage.model.js
/**
 * PracticePassage Model - Nội dung passages (tách riêng để optimize)
 * 
 * Lưu trữ nội dung chi tiết của các reading passages
 * Tách riêng để optimize performance khi query metadata
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class PracticePassage extends Model {}

PracticePassage.init(
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

    passage_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Số thứ tự passage (1, 2, 3...)'
    },

    passage_title: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Tiêu đề passage'
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung passage đầy đủ'
    },

    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tóm tắt passage'
    },

    word_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số từ trong passage'
    }
  },
  {
    sequelize,
    modelName: 'PracticePassage',
    tableName: 'practice_passages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['material_id'] },
      // Unique constraint: một material không thể có 2 passages cùng số
      {
        unique: true,
        fields: ['material_id', 'passage_number'],
        name: 'unique_material_passage'
      }
    ]
  }
);

module.exports = PracticePassage;

