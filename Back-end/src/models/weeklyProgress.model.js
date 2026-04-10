// src/models/weeklyProgress.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class WeeklyProgress extends Model {}

WeeklyProgress.init({
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:          { type: DataTypes.INTEGER, allowNull: false },
  learning_path_id: { type: DataTypes.INTEGER, allowNull: true },
  week_number:      { type: DataTypes.INTEGER, allowNull: false },
  week_start_date:  { type: DataTypes.DATE, allowNull: false },
  tasks_total:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  tasks_completed:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  tests_done:       { type: DataTypes.JSON, allowNull: true },      // [{test_id, attempt_id, score}]
  resources_viewed: { type: DataTypes.JSON, allowNull: true },      // [resource_id, ...]
  completion_rate:  { type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0 },
  reminder_sent:    { type: DataTypes.BOOLEAN, defaultValue: false },
  reminder_sent_at: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'WeeklyProgress',
  tableName: 'weekly_progress',
  timestamps: true,
});

module.exports = WeeklyProgress;
