import { UserContext } from '../types/context.js';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export function requireAuthenticated(user: UserContext): void {
  if (!user.isAuthenticated) {
    throw new UnauthorizedError();
  }
}

export function requireRole(user: UserContext, ...roles: string[]): void {
  requireAuthenticated(user);
  if (!user.role || !roles.includes(user.role)) {
    throw new ForbiddenError();
  }
}
