# Storage Schema Documentation

## Overview

The storage schema is designed to be **forgiving and compatible** with existing
databases. It can be safely run multiple times against the same database without
errors, making it ideal for migrations and upgrades.

## Schema Structure

The schema is organized into **dependency levels** to minimize foreign key
errors and ensure proper table creation order:

### Level 0: Independent Base Tables

Tables with no foreign key dependencies that can be created in any order:

- `spaces` - Workspace/server entities
- `users` - User entities
- `files` - File storage metadata

### Level 1: First-Level Dependencies

Tables that depend only on Level 0 tables:

- `channels` - Communication channels (depends on `spaces`)

### Level 2: Second-Level Dependencies

Tables that depend on Level 0 and Level 1 tables:

- `events` - Chat events/messages (depends on `channels`, `users`, and
  self-references `events`)

### Level 3: Third-Level Dependencies

Tables that depend on Level 0 and Level 2 tables:

- `attachments` - Event attachments (depends on `events` and `files`)

## Key Features

### 1. Idempotent Design

- Uses `CREATE TABLE IF NOT EXISTS` for all tables
- Can be run multiple times without errors
- Preserves existing data and structure

### 2. Dependency-Ordered Creation

- Tables are created in order of their dependencies
- Parent tables are always created before child tables
- Minimizes foreign key constraint errors

### 3. Migration Support

- `migrations.ts` module provides helper functions for schema evolution
- `addColumnIfNotExists()` safely adds columns to existing tables
- Future-proof design for adding new features

## Usage

### Fresh Database

```typescript
import { startStorage } from "@bott/storage";

// Creates new database with full schema
startStorage("/path/to/storage");
```

### Existing Database

```typescript
import { startStorage } from "@bott/storage";

// Safely upgrades existing database
// - Preserves all existing data
// - Adds missing tables
// - Applies any pending migrations
startStorage("/path/to/existing/storage");
```

### Adding New Columns (Future)

```typescript
import { addColumnIfNotExists } from "./data/migrations.ts";
import { STORAGE_DATA_CLIENT } from "./start.ts";

// Safely add new column to existing table
addColumnIfNotExists(
  STORAGE_DATA_CLIENT,
  "spaces",
  "new_field",
  "text",
);
```

## Testing

The schema has been verified to:

- ✅ Create successfully on fresh databases
- ✅ Run idempotently (multiple times without errors)
- ✅ Preserve existing data when run on existing databases
- ✅ Maintain proper foreign key relationships
- ✅ Support the existing application functionality

## Migration Strategy

The migration system uses SQLite's `PRAGMA user_version` to track the current
schema version. This ensures migrations are only applied when needed and in the
correct order.

### Version-Based Migrations

The system tracks schema version using `PRAGMA user_version`:

- Version 0: Initial state (no migrations applied)
- Version 1: Current schema (all base tables)
- Future versions: Incremental schema changes

### Adding New Schema Changes

When adding new schema features:

1. **Increment the version constant** in `migrations.ts`:
   ```typescript
   const CURRENT_SCHEMA_VERSION = 2; // Was 1, now 2
   ```

2. **Add migration logic** in `applyMigrations()`:
   ```typescript
   if (currentVersion < 2) {
     addColumnIfNotExists(db, "spaces", "metadata", 'text default "{}"');
     log.debug("Applied migration: version 1 -> 2");
   }
   ```

3. **Test the migration path**:
   - Test upgrading from version 0 (fresh database)
   - Test upgrading from version 1 (existing database)
   - Test idempotency (running migration multiple times)

### Benefits of Version-Based Migrations

- ✅ Migrations only run when needed (checks current version first)
- ✅ Safe to run multiple times (idempotent)
- ✅ Clear upgrade path from any version
- ✅ No "blind" ALTER TABLE attempts
- ✅ Easy to track which migrations have been applied

## Best Practices

- Always test schema changes against existing databases
- Use `addColumnIfNotExists()` for backward-compatible changes
- Document dependency relationships in comments
- Maintain the dependency-level organization
- Keep migrations in version control
