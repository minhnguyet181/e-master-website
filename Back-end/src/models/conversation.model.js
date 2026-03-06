const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Conversation extends Model {}
Conversation.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  topic: { type: DataTypes.STRING(255) }
}, 
{ sequelize, modelName: 'Conversation', tableName: 'conversations', timestamps: true });

module.exports = Conversation;
