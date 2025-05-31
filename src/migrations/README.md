# Database Migrations

This directory contains SQL migration files for database schema changes.

## Running Migrations

To apply the migrations, you can use the Supabase CLI or execute the SQL directly in the Supabase dashboard SQL editor.

### Using Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run the migration:
   ```bash
   supabase db execute --file src/migrations/add_paid_field_to_jobs.sql
   ```

### Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the migration file
5. Run the query

## Migration Files

- `add_paid_field_to_jobs.sql`: Adds the `paid` field to the jobs table and creates the notifications table
