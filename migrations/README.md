# Database Migrations

SQL migration files for indexes, constraints, and schema changes.

## Schema Management

Main schema is in `shared/schema.ts`. Run `npm run db:push` to create/update tables.

These SQL files add:
- **001_add_indexes.sql** - Performance indexes
- **002_add_constraints.sql** - Data integrity constraints
- **003_add_users_table.sql** - Users table (also in schema.ts)
- **004_add_email_to_resources.sql** - Email column (also in schema.ts)

## Usage

**New setup:**
```bash
npm run db:push
# Required: Create session table (needed for authentication)
psql $DATABASE_URL -f migrations/006_add_session_table.sql
# Optional: add indexes and constraints
psql $DATABASE_URL -f migrations/001_add_indexes.sql
psql $DATABASE_URL -f migrations/002_add_constraints.sql
```

**Existing database:**
Run migrations in order. All use `IF NOT EXISTS` so they're safe to run multiple times.

## Notes

- Migrations are idempotent
- Indexes improve query performance
- Constraints prevent invalid data
- Users table and email column are in the main schema; migrations kept for reference

