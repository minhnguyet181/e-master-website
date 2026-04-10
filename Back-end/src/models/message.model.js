const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Message extends Model {}
Message.init({
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: true },
  role:            { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'user' }, // user | assistant
  content:         { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'Message', tableName: 'messages', timestamps: true });

module.exports = Message;
