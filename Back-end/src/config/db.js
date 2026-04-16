// config/db.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'e-master',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'moon123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    benchmark: true,
    logging: (sql, timingMs) => {
      const queryLogEnabled = String(process.env.DB_QUERY_LOG || '').toLowerCase() === 'true';
      const slowThresholdMs = Number(process.env.DB_SLOW_QUERY_MS || 200);
      if (queryLogEnabled || (typeof timingMs === 'number' && timingMs >= slowThresholdMs)) {
        console.log(`[sql] ${timingMs || 0}ms ${sql}`);
      }
    },
    timezone: '+07:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      underscored: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
