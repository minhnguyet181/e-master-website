// src/models/progress.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');

class Progress extends Model {}

Progress.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: { type: DataTypes.INTEGER, allowNull: false },

    // Kiểu tiến độ: 'learning' hoặc 'test'
    type: { type: DataTypes.STRING(50), allowNull: false },

    // Tổng số nhiệm vụ cần hoàn thành
    total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // Số nhiệm vụ đã hoàn thành
    completed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    // % tiến độ auto tính khi fetch
    progress: { 
      type: DataTypes.VIRTUAL,
      get() {
        if (this.total === 0) return 0;
        return Math.round((this.completed / this.total) * 100);
      }
    }
  },
  {
    sequelize,
    modelName: 'Progress',
    tableName: 'progress',
    timestamps: true,
  }
);

// Relation
Progress.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Progress;
