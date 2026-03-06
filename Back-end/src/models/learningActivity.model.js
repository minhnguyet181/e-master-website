const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class LearningActivity extends Model {}
LearningActivity.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT }
},
 { sequelize, modelName: 'LearningActivity', tableName: 'learning_activities', timestamps: true });

module.exports = LearningActivity;
