// src/models/learningPathProgress.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class LearningPathProgress extends Model {}

LearningPathProgress.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    learning_path_id: { type: DataTypes.INTEGER, allowNull: false },
    current_milestone_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completed_milestone_indexes: { type: DataTypes.JSON, allowNull: true }, // [0,1,2]
    completion_rate: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 0 },
    last_activity_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'LearningPathProgress',
    tableName: 'learning_path_progress',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'learning_path_id'] },
      { fields: ['user_id'] },
      { fields: ['learning_path_id'] },
    ],
  }
);

module.exports = LearningPathProgress;

