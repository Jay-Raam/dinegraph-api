import { createApp } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { closePool, checkDatabaseHealth } from './database/pool.js';
import type { Server } from 'http';

const app = createApp();

const server: Server = app.listen(config.PORT, config.HOST, async () => {
  logger.info(`Server running on http://${config.HOST}:${config.PORT}`);
  logger.info(`GraphQL Playground available at http://${config.HOST}:${config.PORT}/graphql`);
  logger.info(`Health check available at http://${config.HOST}:${config.PORT}/health`);
  logger.info(`DB Readiness probe at http://${config.HOST}:${config.PORT}/ready`);

  // Initial DB connectivity check
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.status === 'healthy') {
    logger.info(`Connected to PostgreSQL Database (Latency: ${dbHealth.latencyMs}ms)`);
  } else {
    logger.warn(
      'PostgreSQL Database is not reachable at startup. Please check your DATABASE_URL in .env'
    );
  }
});

// Graceful Shutdown Handler
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await closePool();
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error closing database pool');
      process.exit(1);
    }
  });

  // Force close if graceful shutdown times out
  setTimeout(() => {
    logger.error('Shutdown timeout exceeded. Forcing exit...');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled Rejection at Promise');
  shutdown('unhandledRejection');
});
