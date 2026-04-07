const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class LearningPath extends Model {}

LearningPath.init({
  id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:           { type: DataTypes.INTEGER, allowNull: false },
  title:             { type: DataTypes.STRING(255), allowNull: false },
  current_band:      { type: DataTypes.STRING(50), allowNull: true },
  target_band:       { type: DataTypes.STRING(50), allowNull: true },
  estimated_weeks:   { type: DataTypes.INTEGER, allowNull: true },
  ai_generated_plan: { type: DataTypes.JSON, allowNull: true },
  status:            { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' }, // active|completed|paused
  generated_at:      { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'LearningPath',
  tableName: 'learning_paths',
  timestamps: true,
});

module.exports = LearningPath;
