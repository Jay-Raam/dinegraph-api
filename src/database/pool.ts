import pg from 'pg';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { DatabaseError } from '../errors/AppError.js';

const { Pool } = pg;

// Supabase SSL and Pool configuration
const poolConfig: pg.PoolConfig = {
  connectionString: config.DATABASE_URL,
  min: config.DB_POOL_MIN,
  max: config.DB_POOL_MAX,
  connectionTimeoutMillis: config.DB_TIMEOUT_MS,
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
  statement_timeout: config.DB_TIMEOUT_MS,
  ssl: config.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: true },
};

export const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL pool');
});

/**
 * Execute a parameterized query with latency tracking and structured error logging.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug(
      {
        query: text.replace(/\s+/g, ' ').trim(),
        rows: res.rowCount,
        durationMs: duration,
      },
      'PostgreSQL Query Executed'
    );
    return res;
  } catch (err: unknown) {
    const duration = Date.now() - start;
    logger.error(
      {
        err,
        query: text.replace(/\s+/g, ' ').trim(),
        durationMs: duration,
      },
      'PostgreSQL Query Failed'
    );
    throw new DatabaseError('Database query failed');
  }
}

/**
 * Execute operations inside a PostgreSQL Transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Transaction rolled back due to error');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Check DB Connectivity (for Health/Readiness Probes)
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown database error',
    };
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL connection pool closed');
}
