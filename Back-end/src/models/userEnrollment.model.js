const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class UserEnrollment extends Model {}
UserEnrollment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, 
{ sequelize, modelName: 'UserEnrollment', tableName: 'user_enrollments', timestamps: false });

module.exports = UserEnrollment;
