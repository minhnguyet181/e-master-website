// src/models/resource.model.js
/**
 * Resource Model - Lưu trữ tài liệu học tập
 * 
 * Resources bao gồm:
 * - Articles: Bài viết hướng dẫn
 * - Tips: Mẹo học tập
 * - Grammar rules: Quy tắc ngữ pháp
 * - Vocabulary lists: Danh sách từ vựng
 * - Video lessons: Bài học video
 * - Practice exercises: Bài tập thực hành
 * 
 * Chatbot sẽ search trong resources này để trả lời câu hỏi của user
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Resource extends Model {}

Resource.init(
  {
    // ========== Primary Key ==========
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },

    // ========== Content ==========
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Tiêu đề tài liệu'
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Nội dung đầy đủ của tài liệu (dùng để chatbot tham khảo)'
    },

    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tóm tắt ngắn gọn (hiển thị preview cho user)'
    },

    // ========== Classification ==========
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Loại tài liệu: grammar_rule, vocabulary, ielts_tip, toeic_tip, reference, example, template, article'
    },

    exam_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Loại kỳ thi: IELTS, TOEIC, general'
    },

    topic: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Chủ đề tự do của tài liệu'
    },

    skill: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'Kỹ năng liên quan'
    },

    level: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Trình độ phù hợp: "Beginner", "Intermediate", "Advanced", "Band 5-6", "Band 7-8", etc.'
    },

    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
      comment: 'Độ khó từ 1-5 (1: rất dễ, 5: rất khó)'
    },

    // ========== Tags & Search ==========
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Tags để search dễ hơn. Format: ["ielts", "task2", "opinion-essay", "environment"]'
    },

    keywords: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Keywords quan trọng trong tài liệu. Format: ["climate change", "global warming", "pollution"]'
    },

    // ========== External Links ==========
    url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: 'Link external nếu tài liệu ở ngoài (video YouTube, article link, etc.)'
    },

    source: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nguồn tài liệu: "Cambridge IELTS 15", "British Council", "Internal", etc.'
    },

    // ========== Media ==========
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL hình ảnh thumbnail'
    },

    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL video (nếu resource_type là video)'
    },

    video_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Độ dài video (giây)'
    },

    // ========== Statistics ==========
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần tài liệu được xem/sử dụng'
    },

    helpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần user đánh giá là hữu ích'
    },

    unhelpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Số lần user đánh giá là không hữu ích'
    },

    average_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Đánh giá trung bình (0.00 - 5.00)'
    },

    // ========== Status ==========
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Tài liệu có đang active không (để hide/show)'
    },

    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Tài liệu nổi bật (hiển thị ưu tiên)'
    },

    // ========== Metadata ==========
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Thông tin bổ sung linh hoạt: {author: "...", publish_date: "...", estimated_time: 15, ...}'
    }
  },
  { 
    sequelize, 
    modelName: 'Resource', 
    tableName: 'resources', 
    timestamps: true, // createdAt, updatedAt
    indexes: [
      { fields: ['resource_type'] },
      { fields: ['skill'] },
      { fields: ['level'] },
      { fields: ['is_active'] },
      { fields: ['is_featured'] },
      { fields: ['view_count'] },
      { fields: ['exam_type'] },
      { fields: ['topic'] }
    ]
  }
);

module.exports = Resource;

