// src/models/test.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Test extends Model {}

Test.init({
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code:             { type: DataTypes.STRING(80), allowNull: false, unique: true },
  name:             { type: DataTypes.STRING(255), allowNull: false },
  test_type:        { type: DataTypes.STRING(20), allowNull: false }, // listening|reading|writing|speaking
  task_type:        { type: DataTypes.STRING(20), allowNull: true },  // task1|task2 (writing only)
  description:      { type: DataTypes.TEXT, allowNull: true },
  duration_minutes: { type: DataTypes.INTEGER, defaultValue: 60 },
  level:            { type: DataTypes.STRING(50), defaultValue: 'IELTS' },
  audio_url:        { type: DataTypes.STRING(500), allowNull: true }, // listening test audio
  pdf_url:          { type: DataTypes.STRING(500), allowNull: true }, // admin-uploaded PDF
  pdf_parsed:       { type: DataTypes.BOOLEAN, defaultValue: false },
  source:           { type: DataTypes.STRING(20), defaultValue: 'db' }, // db | pdf | static
  is_active:        { type: DataTypes.BOOLEAN, defaultValue: true },
  tags:             { type: DataTypes.JSON, allowNull: true },
  metadata:         { type: DataTypes.JSON, allowNull: true },
}, {
  sequelize,
  modelName: 'Test',
  tableName: 'tests',
  timestamps: true,
});

module.exports = Test;
