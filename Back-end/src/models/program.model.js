const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
class Program extends Model {}
Program.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT }
}, 
{ sequelize, modelName: 'Program', tableName: 'programs', timestamps: true });

module.exports = Program;
