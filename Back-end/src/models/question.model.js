const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
class Question extends Model {}
Question.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSONB, allowNull: true },
  correct_answer: { type: DataTypes.STRING(255), allowNull: true },
  points: { type: DataTypes.INTEGER, allowNull: true },
  hint: { type: DataTypes.TEXT, allowNull: true }
}, 
{ sequelize, modelName: 'Question', tableName: 'questions', timestamps: true });

module.exports = Question;
