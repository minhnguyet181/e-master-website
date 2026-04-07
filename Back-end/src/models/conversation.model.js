const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Conversation extends Model {}
Conversation.init({
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  topic:   { type: DataTypes.STRING(255), allowNull: true },
}, { sequelize, modelName: 'Conversation', tableName: 'conversations', timestamps: true });

module.exports = Conversation;
