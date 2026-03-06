const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TokenBlocklist extends Model {}
TokenBlocklist.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  token: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, 
{ sequelize, modelName: 'TokenBlocklist', tableName: 'token_blocklist', timestamps: false });

module.exports = TokenBlocklist;
