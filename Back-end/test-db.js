import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_CdRvr87jozOE@ep-odd-star-a1nho0fs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to DB:', res.rows[0]);
  } catch (err) {
    console.error('❌ DB connection error:', err);
  } finally {
    pool.end();
  }
}

test();
