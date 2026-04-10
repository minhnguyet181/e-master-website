// src/models/testSection.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TestSection extends Model {}

TestSection.init({
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  test_id:      { type: DataTypes.INTEGER, allowNull: false },
  section_no:   { type: DataTypes.INTEGER, allowNull: false },
  title:        { type: DataTypes.STRING(255), allowNull: true },
  passage_text: { type: DataTypes.TEXT, allowNull: true },       // reading passage
  audio_url:    { type: DataTypes.STRING(500), allowNull: true }, // per-section audio (listening)
  image_url:    { type: DataTypes.STRING(500), allowNull: true }, // writing task 1 image
  content:      { type: DataTypes.JSON, allowNull: true },
  media:        { type: DataTypes.JSON, allowNull: true },
  metadata:     { type: DataTypes.JSON, allowNull: true },
}, {
  sequelize,
  modelName: 'TestSection',
  tableName: 'test_sections',
  timestamps: true,
});

module.exports = TestSection;

