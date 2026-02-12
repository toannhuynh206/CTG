import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: intFromEnv('PG_POOL_MAX', 40),
  idleTimeoutMillis: intFromEnv('PG_POOL_IDLE_TIMEOUT_MS', 30000),
  connectionTimeoutMillis: intFromEnv('PG_POOL_CONNECTION_TIMEOUT_MS', 5000),
});

export default pool;
