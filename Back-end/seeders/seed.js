#!/usr/bin/env node

/**
 * Seed Script - Populate Database with IELTS Resources
 * Usage: node seeders/seed.js
 */

require('dotenv').config();
const sequelize = require('../src/config/db');
const { seedResources } = require('./resources.seeder');

async function runSeed() {
  try {
    console.log('🚀 Starting database seed...');
    
    // Sync database
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');

    // Run seeders
    await seedResources();

    console.log('✅ All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
