import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../database/pool.js';

export const healthRouter = Router();

/**
 * Liveness Probe: Verifies HTTP server is up.
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness Probe: Verifies Database connectivity and connection latency.
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const isHealthy = dbHealth.status === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ready' : 'not_ready',
    database: {
      status: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
    },
    timestamp: new Date().toISOString(),
  });
});
