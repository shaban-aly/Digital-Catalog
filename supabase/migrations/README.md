# Supabase Migrations

## Important: Initial Schema Note

The initial database schema for this project (`001-core-catalog-platform`) was applied directly via the Supabase Dashboard before migration tracking was established. As a result, there is no migration file for the initial schema.

**Reference**: The complete initial schema SQL is documented in:
`specs/001-core-catalog-platform/contracts/database-schema.sql`

## Migration Tracking Begins Here

All future database changes — starting with `002-dynamic-subdomains` — are tracked as ordered, timestamped SQL migration files in this directory.

## Naming Convention

```
YYYYMMDDHHMMSS_<domain>_<action>.sql
```

Examples:
- `20261106160000_tenant_status_and_dns_constraints.sql`
- `20261106160500_tenant_reserved_slugs_registry.sql`

## Rules

1. Never edit an already-applied migration.
2. Create a new migration for every subsequent change.
3. Group related changes into cohesive migrations.
4. Split large features into multiple ordered migrations when their database changes have distinct responsibilities.
5. Keep development seeds separate from schema migrations.

## Applying Migrations

```bash
# Link project (first time)
supabase link --project-ref opgiyqxsthrxzrbgupso

# Apply all pending migrations
supabase db push

# Generate TypeScript types after applying migrations
npx supabase gen types typescript --project-id opgiyqxsthrxzrbgupso > src/shared/database.types.ts
```

> **WARNING**: Never run `supabase db push` against production without reviewing the migration SQL first.
> Always back up data before applying schema changes to a live database.
