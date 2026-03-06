// src/models/gradingCache.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class GradingCache extends Model {}

GradingCache.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cache_key: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    test_type: { type: DataTypes.STRING(20), allowNull: false },
    answer_hash: { type: DataTypes.STRING(64), allowNull: false },
    rubric_ver: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'v1' },
    ai_provider: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'gemini' },
    result_json: { type: DataTypes.JSONB, allowNull: false },
    hit_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    expires_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'GradingCache',
    tableName: 'grading_cache',
    timestamps: true,
  }
);

module.exports = GradingCache;

