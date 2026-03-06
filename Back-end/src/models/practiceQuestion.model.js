// src/models/practiceQuestion.model.js
/**
 * PracticeQuestion Model - Câu hỏi cho practice materials
 * 
 * Lưu trữ các câu hỏi liên quan đến practice materials
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class PracticeQuestion extends Model {}

PracticeQuestion.init(
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

    passage_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của passage (nếu câu hỏi thuộc passage cụ thể)'
    },

    question_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Số thứ tự câu hỏi'
    },

    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung câu hỏi'
    },

    question_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Loại câu hỏi: multiple_choice, true_false, fill_blank, etc.'
    },

    options: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Các lựa chọn (nếu là multiple choice). Format: ["A", "B", "C", "D"]'
    },

    correct_answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Đáp án đúng'
    },

    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Giải thích đáp án'
    },

    points: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Điểm số của câu hỏi'
    },

    difficulty: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Độ khó: easy, medium, hard'
    }
  },
  {
    sequelize,
    modelName: 'PracticeQuestion',
    tableName: 'practice_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['material_id'] },
      { fields: ['passage_id'] },
      { fields: ['question_type'] },
      // Unique constraint: một material không thể có 2 questions cùng số
      {
        unique: true,
        fields: ['material_id', 'question_number'],
        name: 'unique_material_question'
      }
    ]
  }
);

module.exports = PracticeQuestion;

