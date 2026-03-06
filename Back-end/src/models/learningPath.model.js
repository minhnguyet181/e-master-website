const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
class LearningPath extends Model {}
LearningPath.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(255), allowNull: false }
}, 
{ sequelize, modelName: 'LearningPath', tableName: 'learning_paths', timestamps: true });

module.exports = LearningPath;
