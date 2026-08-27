import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] || 'unknown';

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        errName: err.name,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
      },
      err.message
    );

    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  logger.error({ requestId, err }, 'Unhandled Internal Server Error');

  res.status(500).json({
    error: {
      message:
        config.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      requestId,
      ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}
