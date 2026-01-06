# Database Migration Guide

## Overview

All file-based storage has been migrated to PostgreSQL database tables. This guide explains how to set up the database and run migrations.

## Prerequisites

1. **Supabase Project Created**
   - Create a new Supabase project (or use existing)
   - Get the `DATABASE_URL` connection string

2. **DATABASE_URL Format**
   - Direct connection: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - Connection pooling: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## Running Migrations

### Option 1: Using Drizzle Kit (Recommended)

Once you have `DATABASE_URL`:

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres.bzrkxonsygwiqjhnyvuq:UgAQBxY7*3ye7CE@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

# Generate migrations from schema
npm run db:push

# Or generate migration files (for version control)
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Option 2: Manual SQL (If needed)

If you prefer to run SQL directly in Supabase SQL Editor, the tables are defined in `shared/schema.ts`. The schema includes:

- `admin_users`
- `electrician_applications`
- `electricians`
- `jobs`
- `job_events`
- `disputes`
- `customers`
- `balance_transactions`
- `configs`
- `audit_logs`
- `marketing_leads` (already exists)

## Verification

After migrations:

1. Check that all tables exist in Supabase
2. Verify `admin_users` table is empty (default admin will be created on first run)
3. Test the application - default admin will be created automatically:
   - Email: `admin@modo.jo`
   - Password: `admin123`

## Notes

- The `marketing_leads` table already exists and is working
- All other tables are new and need to be created
- Demo data seeding will happen automatically on first run (if tables are empty)





