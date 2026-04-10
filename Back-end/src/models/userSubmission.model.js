// src/models/userSubmission.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model');
const Test = require('./test.model');

class UserSubmission extends Model {}

UserSubmission.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: { type: DataTypes.INTEGER, allowNull: false },
    test_id: { type: DataTypes.INTEGER, allowNull: false },

    // Lưu câu trả lời dưới dạng object
    answers: { type: DataTypes.JSON, allowNull: true },

    // Với Reading/Listening MCQ
    is_correct: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Với Writing/Speaking
    score: { type: DataTypes.FLOAT, allowNull: true },

    ai_feedback: { type: DataTypes.TEXT, allowNull: true },

    submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'UserSubmission',
    tableName: 'user_submissions',
    timestamps: true,
  }
);

// Relations
UserSubmission.belongsTo(User, { foreignKey: 'user_id' });
UserSubmission.belongsTo(Test, { foreignKey: 'test_id' });

module.exports = UserSubmission;
