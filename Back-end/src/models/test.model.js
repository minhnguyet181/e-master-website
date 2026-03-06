const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Test extends Model {}

Test.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name: { type: DataTypes.STRING(255), allowNull: false },

    test_type: {
      type: DataTypes.ENUM('listening', 'reading', 'writing', 'speaking'),
      allowNull: false,
    },

    description: { type: DataTypes.TEXT, allowNull: true },

    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 60 },

    level: {
      type: DataTypes.STRING(50),
      defaultValue: 'IELTS',
    },

    // Các trường đồng bộ từ bảng câu hỏi
    content: { type: DataTypes.TEXT, allowNull: true },
    options: { type: DataTypes.JSON, allowNull: true },
    correct_answer: { type: DataTypes.STRING, allowNull: true },
    points: { type: DataTypes.INTEGER, defaultValue: 1 },
    hint: { type: DataTypes.TEXT, allowNull: true },
    question_number: { type: DataTypes.INTEGER, allowNull: true },
    section: { type: DataTypes.STRING(100), allowNull: true },

    // Trường bổ sung để dễ lưu và lọc
    test_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Test',
    tableName: 'tests',
    timestamps: true,
  }
);

module.exports = Test;