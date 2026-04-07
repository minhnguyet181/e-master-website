// src/models/placementTest.model.js
/**
 * PlacementTest Model - Lưu trữ kết quả placement test
 * 
 * Sau khi user làm placement test, AI sẽ phân loại band
 * và lưu kết quả vào đây
 */

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class PlacementTest extends Model {}

PlacementTest.init({
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID của user làm test'
  },
  
  title: { 
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Tiêu đề test (nếu có)'
  },
  
  description: { 
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả test'
  },
  
  // ========== Test Results ==========
  answers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Câu trả lời của user. Format: [{question_id: 1, answer: "A"}, ...]'
  },
  
  scores: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Điểm từng skill. Format: {reading: 5.5, listening: 6.0, writing: 5.0, speaking: 5.5}'
  },
  
  // ========== AI Classification ==========
  assessed_band: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Band được AI đánh giá (ví dụ: "Band 5.0", "Band 6.5")'
  },
  
  assessed_level: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Level được đánh giá (ví dụ: "Intermediate", "Upper-Intermediate")'
  },
  
  ai_analysis: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Phân tích chi tiết từ AI về trình độ của user'
  },
  
  weak_skills: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Kỹ năng yếu. Format: ["writing", "speaking"]'
  },
  
  strong_skills: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Kỹ năng mạnh. Format: ["reading", "listening"]'
  },
  
  // ========== Recommendations ==========
  recommended_program: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Chương trình học được đề xuất'
  },
  
  study_recommendations: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Gợi ý học tập. Format: ["Focus on Writing", "Practice Speaking daily"]'
  },
  
  // ========== Status ==========
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Test đã hoàn thành chưa'
  },
  
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời điểm hoàn thành test'
  }
}, 
{ 
  sequelize, 
  modelName: 'PlacementTest', 
  tableName: 'placement_tests', 
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_completed'] },
    { fields: ['assessed_band'] }
  ]
});

module.exports = PlacementTest;
