// src/models/testAttempt.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TestAttempt extends Model {}

TestAttempt.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    test_id: { type: DataTypes.INTEGER, allowNull: false },
    test_type: { type: DataTypes.STRING(20), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'submitted' },
    answers: { type: DataTypes.JSONB, allowNull: false },
    answer_hash: { type: DataTypes.STRING(64), allowNull: false },
    result_json: { type: DataTypes.JSONB, allowNull: true },
    score_numeric: { type: DataTypes.DOUBLE, allowNull: true },
    correct_count: { type: DataTypes.INTEGER, allowNull: true },
    total_count: { type: DataTypes.INTEGER, allowNull: true },
    cache_hit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    graded_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'TestAttempt',
    tableName: 'test_attempts',
    timestamps: true,
  }
);

module.exports = TestAttempt;

