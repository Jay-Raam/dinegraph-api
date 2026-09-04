import { strict as assert } from 'node:assert';
import test from 'node:test';
import { requireAuthenticated, requireRole } from '../src/middleware/authorization.js';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../src/errors/AppError.js';
import { BaseRepository } from '../src/repositories/base.repository.js';
import { buildSchema, parse, validate } from 'graphql';
import { queryLimitsRule } from '../src/graphql/queryLimits.js';

class TestRepository extends BaseRepository {
  normalize(pagination: { limit?: number; offset?: number }) {
    return this.normalizePagination(pagination);
  }
}

test('rejects anonymous users for protected operations', () => {
  assert.throws(
    () => requireAuthenticated({ isAuthenticated: false, role: 'anonymous' }),
    (error: unknown) => error instanceof UnauthorizedError
  );
});

test('allows admins and rejects non-admin users', () => {
  assert.doesNotThrow(() => requireRole({ isAuthenticated: true, role: 'admin' }, 'admin'));
  assert.throws(
    () => requireRole({ isAuthenticated: true, role: 'user' }, 'admin'),
    (error: unknown) => error instanceof ForbiddenError
  );
});

test('rejects invalid pagination values', () => {
  const repository = new TestRepository();
  assert.deepEqual(repository.normalize({}), { limit: 20, offset: 0 });
  assert.throws(() => repository.normalize({ limit: 0 }), (error: unknown) => error instanceof ValidationError);
  assert.throws(() => repository.normalize({ limit: 101 }), (error: unknown) => error instanceof ValidationError);
  assert.throws(() => repository.normalize({ offset: -1 }), (error: unknown) => error instanceof ValidationError);
  assert.throws(() => repository.normalize({ offset: 100001 }), (error: unknown) => error instanceof ValidationError);
});

test('rejects overly deep GraphQL documents', () => {
  const schema = buildSchema('type Query { node: Node } type Node { node: Node value: String }');
  const query = `{ node { node { node { node { node { node { node { node { value } } } } } } } } }`;
  const errors = validate(schema, parse(query), [queryLimitsRule]);
  assert.equal(errors.some((error) => error.extensions.code === 'QUERY_TOO_COMPLEX'), true);
});

test('applies GraphQL limits when fragments follow the operation', () => {
  const schema = buildSchema('type Query { node: Node } type Node { node: Node value: String }');
  const query = `query { node { ...Deep } } fragment Deep on Node { node { node { node { node { node { node { node { value } } } } } } } }`;
  const errors = validate(schema, parse(query), [queryLimitsRule]);
  assert.equal(errors.some((error) => error.extensions.code === 'QUERY_TOO_COMPLEX'), true);
});
