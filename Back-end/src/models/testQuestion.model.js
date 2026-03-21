// src/models/testQuestion.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TestQuestion extends Model {}

TestQuestion.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    test_id: { type: DataTypes.INTEGER, allowNull: false },
    section_id: { type: DataTypes.INTEGER, allowNull: true },
    public_id: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    question_no: { type: DataTypes.INTEGER, allowNull: false },
    question_type: { type: DataTypes.STRING(50), allowNull: false },
    prompt: { type: DataTypes.TEXT, allowNull: true },
    options: { type: DataTypes.JSONB, allowNull: true },
    correct_answer: { type: DataTypes.TEXT, allowNull: true },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    modelName: 'TestQuestion',
    tableName: 'test_questions',
    timestamps: true,
  }
);

module.exports = TestQuestion;

