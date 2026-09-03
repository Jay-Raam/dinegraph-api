import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserContext } from '../types/context.js';
import { logger } from '../config/logger.js';
export { requireAuthenticated, requireRole } from './authorization.js';

export function extractAuthContext(req: Request): UserContext {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Check API Key authentication
  if (config.API_KEY && apiKey === config.API_KEY) {
    return {
      userId: 'api-client',
      role: 'admin',
      isAuthenticated: true,
    };
  }

  // Check Bearer JWT token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256'],
        ...(config.JWT_ISSUER ? { issuer: config.JWT_ISSUER } : {}),
        ...(config.JWT_AUDIENCE ? { audience: config.JWT_AUDIENCE } : {}),
      }) as {
        sub?: string;
        userId?: string;
        role?: string;
        exp?: number;
      };
      const userId = decoded.sub || decoded.userId;
      if (!userId || !decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error('JWT is missing a valid subject or expiration');
      }
      return {
        userId,
        role: decoded.role === 'admin' ? 'admin' : 'user',
        isAuthenticated: true,
      };
    } catch (err) {
      logger.warn({ err }, 'Invalid JWT token supplied in authorization header');
    }
  }

  // Anonymous user
  return {
    isAuthenticated: false,
    role: 'anonymous',
  };
}

