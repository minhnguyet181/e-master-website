const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
class QuestionType extends Model {}
QuestionType.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT }
}, 
{ sequelize, modelName: 'QuestionType', tableName: 'question_types', timestamps: true });

module.exports = QuestionType;
