// src/models/aiCache.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class AICache extends Model {}

AICache.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cache_key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    cache_type: { type: DataTypes.STRING(50), allowNull: false }, // chat | learning_plan | other
    model: { type: DataTypes.STRING(100), allowNull: true },
    prompt_hash: { type: DataTypes.STRING(128), allowNull: false },
    result_text: { type: DataTypes.TEXT('long'), allowNull: false },
    hit_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    expires_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'AICache',
    tableName: 'ai_cache',
    timestamps: true,
    indexes: [{ fields: ['cache_type'] }, { fields: ['expires_at'] }],
  }
);

module.exports = AICache;

