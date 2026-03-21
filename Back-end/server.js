require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db');
const routes = require('./src/routes');
const { applyTestV2Associations } = require('./src/models/testV2.associations');

const app = express();
const url = process.env.FRONTEND_URL;
app.use(cors({
  origin: url, 
  credentials: true, 
}));

app.use(express.json());

app.use('/e-master', routes);

// Apply associations once at boot (doesn't hit DB)
applyTestV2Associations();

const shouldSync = String(process.env.DB_SYNC || '').toLowerCase() === 'true';

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Prefer migrations. Only sync when explicitly enabled.
    if (shouldSync) {
      await sequelize.sync();
      console.log('✅ Database synced (DB_SYNC=true)');
    }

    app.listen(1818, () => console.log('🚀 Server running on port 1818'));
  } catch (err) {
    console.error('❌ DB connection failed:', err);
  }
};

startServer();
