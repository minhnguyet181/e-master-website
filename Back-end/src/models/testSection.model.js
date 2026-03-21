// src/models/testSection.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TestSection extends Model {}

TestSection.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    test_id: { type: DataTypes.INTEGER, allowNull: false },
    section_no: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.JSONB, allowNull: true },
    media: { type: DataTypes.JSONB, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    modelName: 'TestSection',
    tableName: 'test_sections',
    timestamps: true,
  }
);

module.exports = TestSection;

