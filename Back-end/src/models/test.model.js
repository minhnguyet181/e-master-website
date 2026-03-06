const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Test extends Model {}

Test.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
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

    source: { type: DataTypes.STRING(20), defaultValue: 'db' }, // db | static
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    tags: { type: DataTypes.JSONB, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Test',
    tableName: 'tests',
    timestamps: true,
  }
);

module.exports = Test;