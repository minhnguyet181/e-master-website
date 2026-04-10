require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'moon123',
  database: process.env.DB_NAME || 'e-master',
  host:     process.env.DB_HOST || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  dialect:  'mysql',
  logging:  false,
  timezone: '+07:00',
  dialectOptions: {
    charset: 'utf8mb4',
  },
};

module.exports = {
  development: base,
  test:        { ...base, database: process.env.DB_NAME_TEST || 'e-master-test' },
  production:  base,
};
