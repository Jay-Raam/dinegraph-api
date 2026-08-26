\ir ../src/database/schema.sql

INSERT INTO public.schema_migrations (version)
VALUES ('001_initial_schema')
ON CONFLICT (version) DO NOTHING;