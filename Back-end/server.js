require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db');
const routes = require('./src/routes');


const app = express();
const url = process.env.FRONTEND_URL;
app.use(cors({
  origin: url, 
  credentials: true, 
}));

app.use(express.json());

app.use('/e-master', routes);

sequelize.sync()
  .then(() => {
    console.log('✅ Database synced');
    app.listen(1818, () => console.log('🚀 Server running on port 1818'));
  })
  .catch(err => console.error('❌ DB connection failed:', err));
