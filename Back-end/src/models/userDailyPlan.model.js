// src/models/userDailyPlan.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserDailyPlan extends Model {}

UserDailyPlan.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plan_date: { type: DataTypes.DATEONLY, allowNull: false },
    tasks: { type: DataTypes.JSON, allowNull: false }, // [{ id, type, ... }]
    completed_task_ids: { type: DataTypes.JSON, allowNull: true }, // [taskId, ...]
    is_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'UserDailyPlan',
    tableName: 'user_daily_plans',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['user_id', 'plan_date'] },
      { fields: ['user_id'] },
      { fields: ['plan_date'] },
    ],
  }
);

module.exports = UserDailyPlan;

