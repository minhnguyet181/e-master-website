// src/models/learningPathWeek.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class LearningPathWeek extends Model {}

LearningPathWeek.init({
  id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  learning_path_id:    { type: DataTypes.INTEGER, allowNull: false },
  week_number:         { type: DataTypes.INTEGER, allowNull: false },
  focus_skills:        { type: DataTypes.JSON, allowNull: true },   // ["writing","speaking"]
  goals:               { type: DataTypes.JSON, allowNull: true },   // string[]
  resource_ids:        { type: DataTypes.JSON, allowNull: true },   // number[]
  test_ids:            { type: DataTypes.JSON, allowNull: true },   // number[]
  min_completion_rate: { type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0.70 },
}, {
  sequelize,
  modelName: 'LearningPathWeek',
  tableName: 'learning_path_weeks',
  timestamps: true,
});

module.exports = LearningPathWeek;
