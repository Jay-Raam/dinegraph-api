# Database migrations

Apply SQL files in this directory in filename order against the target PostgreSQL database. Each migration must be forward-only, timestamped or sequentially numbered, and safe to run exactly once.

The current database definition is in `src/database/schema.sql`. The first migration creates a migration tracking table and applies that schema through `psql`'s `\ir` command. Keep future schema changes as new SQL files rather than editing an already-applied migration.

Example:

```bash
psql "$DATABASE_URL" -f migrations/000_migration_tracking.sql
psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
```
