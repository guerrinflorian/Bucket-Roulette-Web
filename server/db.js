import pg from 'pg';

const { Pool } = pg;

const ssl = process.env.DATABASE_SSL === 'false'
  ? false
  : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl
});

export async function query(text, params) {
  return pool.query(text, params);
}

