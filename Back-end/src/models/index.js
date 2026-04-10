'use strict';

// This file re-exports the shared sequelize instance and all models.
// All models use the direct Model.init() pattern with src/config/db.js (MySQL).

const sequelize = require('../config/db');
const { Sequelize } = require('sequelize');

const db = {
  sequelize,
  Sequelize,
};

module.exports = db;
