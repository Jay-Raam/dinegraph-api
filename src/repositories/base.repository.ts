import { ValidationError } from '../errors/AppError.js';
import { PaginationInput } from '../types/models.js';

/**
 * Helper to normalize PostgreSQL result rows.
 * PostgreSQL identifiers are lowercase by default unless quoted.
 * This helper ensures safe property access regardless of column case.
 */
export class BaseRepository {
  protected normalizePagination(pagination: PaginationInput = {}): Required<PaginationInput> {
    const limit = pagination.limit ?? 20;
    const offset = pagination.offset ?? 0;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError('Pagination limit must be an integer between 1 and 100');
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new ValidationError('Pagination offset must be a non-negative integer');
    }
    if (offset > 100_000) {
      throw new ValidationError('Pagination offset must not exceed 100000');
    }
    return { limit, offset };
  }

  protected normalizeRow<T>(row: Record<string, unknown>): T {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key.toLowerCase()] = value;
    }
    return normalized as T;
  }

  protected normalizeRows<T>(rows: Record<string, unknown>[]): T[] {
    return rows.map((row) => this.normalizeRow<T>(row));
  }
}
