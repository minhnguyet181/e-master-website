// src/models/practiceMaterial.model.js
/**
 * PracticeMaterial Model - Bảng chính - Metadata của practice materials
 * 
 * Lưu trữ metadata của các tài liệu luyện tập (reading passages, writing prompts, etc.)
 * Nội dung chi tiết được tách ra các bảng riêng để optimize performance
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class PracticeMaterial extends Model {}

PracticeMaterial.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Tiêu đề tài liệu luyện tập'
    },

    skill: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Kỹ năng: reading, writing, speaking, listening'
    },

    material_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Loại tài liệu: reading_passage, writing_prompt, speaking_topic, etc.'
    },

    difficulty_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Độ khó: easy, medium, hard'
    },

    exam_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'IELTS',
      comment: 'Loại kỳ thi: IELTS, TOEFL, etc.'
    },

    test_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số test (nếu có)'
    },

    topic: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Chủ đề'
    },

    estimated_band: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      comment: 'Band ước tính: 5.0, 6.5, 7.0, etc.'
    },

    word_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số từ'
    },

    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thời gian ước tính (phút)'
    },

    source_file: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'File nguồn (nếu có)'
    },

    // Metadata
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Tags để search'
    },

    keywords: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Keywords quan trọng'
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Metadata bổ sung'
    },

    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Có đang active không'
    },

    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Có được featured không'
    },

    // Tracking
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần xem'
    },

    attempt_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần attempt'
    },

    average_score: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      comment: 'Điểm trung bình'
    }
  },
  {
    sequelize,
    modelName: 'PracticeMaterial',
    tableName: 'practice_materials',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['skill'] },
      { fields: ['difficulty_level'] },
      { fields: ['topic'] },
      { fields: ['test_number'] },
      { fields: ['is_active'] }
    ]
  }
);

module.exports = PracticeMaterial;

