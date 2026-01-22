# Supabase Developer Scripts

This directory contains helpful scripts for Supabase development workflows.

## Project Setup

### setup-project.sh
Initialize a new Supabase project with configuration and directory structure.

```bash
./scripts/setup-project.sh <project-name>
```

**What it does:**
- Installs Supabase CLI if not present
- Initializes Supabase project with `supabase init`
- Creates recommended directory structure
- Generates `.env.local` template
- Updates `.gitignore` with Supabase-specific entries

**Example:**
```bash
./scripts/setup-project.sh my-app
```

### link-project.sh
Link your local project to a remote Supabase project.

```bash
./scripts/link-project.sh <project-ref>
```

**What it does:**
- Prompts for login if not authenticated
- Links local project to remote Supabase project
- Enables pushing/pulling schema changes

**Example:**
```bash
./scripts/link-project.sh abcdefghijklmnop
```

## Local Development

### local-dev.sh
Start local Supabase development environment with Docker.

```bash
./scripts/local-dev.sh [--reset]
```

**Flags:**
- `--reset` - Reset database before starting

**What it does:**
- Checks Docker is running
- Optionally resets database with `supabase db reset`
- Starts all Supabase services locally
- Displays connection information and service URLs

**Example:**
```bash
./scripts/local-dev.sh           # Start normally
./scripts/local-dev.sh --reset   # Reset and start
```

**Services started:**
- Studio UI: http://localhost:54323
- API Gateway: http://localhost:54321
- PostgreSQL: localhost:54322
- Inbucket (email testing): http://localhost:54324

## Database Management

### create-migration.sh
Create a new timestamped database migration file.

```bash
./scripts/create-migration.sh <migration-name>
```

**What it does:**
- Creates new migration file in `supabase/migrations/`
- Uses timestamp-based naming
- Provides next steps guidance

**Example:**
```bash
./scripts/create-migration.sh add_profiles_table
# Creates: supabase/migrations/20240122150000_add_profiles_table.sql
```

### run-migrations.sh
Apply pending migrations to local or remote database.

```bash
./scripts/run-migrations.sh [--local|--remote]
```

**Flags:**
- `--local` (default) - Apply to local database
- `--remote` - Apply to linked remote database (requires confirmation)

**What it does:**
- Runs pending migrations with `supabase db push`
- For remote: prompts for confirmation before applying
- Reminds to update TypeScript types after migration

**Example:**
```bash
./scripts/run-migrations.sh --local    # Apply locally
./scripts/run-migrations.sh --remote   # Deploy to production
```

### seed-database.sh
Seed local database with test data.

```bash
./scripts/seed-database.sh
```

**What it does:**
- Creates template `supabase/seed.sql` if it doesn't exist
- Applies seed file to local database
- Useful for consistent test data across team

**Example:**
```bash
./scripts/seed-database.sh
```

**Seed file location:** `supabase/seed.sql`

### generate-types.sh
Generate TypeScript types from database schema.

```bash
./scripts/generate-types.sh [--output PATH]
```

**Flags:**
- `--output PATH` - Custom output path (default: `src/types/database.types.ts`)

**What it does:**
- Generates TypeScript types from local database schema
- Creates type-safe database access
- Should be run after every schema change

**Example:**
```bash
./scripts/generate-types.sh
./scripts/generate-types.sh --output lib/database.types.ts
```

**Usage in code:**
```typescript
import type { Database } from '@/types/database.types'
const supabase = createClient<Database>(url, key)
```

### backup-database.sh
Create a backup of the local database.

```bash
./scripts/backup-database.sh [--output PATH]
```

**Flags:**
- `--output PATH` - Custom output path (default: `backups/backup_TIMESTAMP.sql`)

**What it does:**
- Creates SQL dump of local database
- Includes schema and data from public schema
- Uses timestamp in filename

**Example:**
```bash
./scripts/backup-database.sh
./scripts/backup-database.sh --output my-backup.sql
```

**Restore a backup:**
```bash
psql -h localhost -p 54322 -U postgres -d postgres -f backups/backup_20240122_150000.sql
```

## Edge Functions

### create-function.sh
Create a new Edge Function with boilerplate code.

```bash
./scripts/create-function.sh <function-name>
```

**What it does:**
- Creates new function in `supabase/functions/<function-name>/`
- Includes production-ready boilerplate with:
  - CORS handling
  - Supabase client initialization
  - Authentication check
  - Error handling
  - Type definitions

**Example:**
```bash
./scripts/create-function.sh send-email
# Creates: supabase/functions/send-email/index.ts
```

### serve-functions.sh
Run Edge Functions locally for development and testing.

```bash
./scripts/serve-functions.sh
```

**What it does:**
- Starts local Deno server for Edge Functions
- Loads environment variables from `supabase/.env`
- Serves functions at http://localhost:54321/functions/v1

**Example:**
```bash
./scripts/serve-functions.sh

# Test with curl:
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"user@example.com"}'
```

### deploy-function.sh
Deploy Edge Functions to production.

```bash
./scripts/deploy-function.sh <function-name> [--all]
```

**Flags:**
- `--all` - Deploy all functions (excludes `_shared` folder)

**What it does:**
- Deploys specified function to linked Supabase project
- Skips `_shared` directory (used for utilities)
- Provides example curl command for testing

**Example:**
```bash
./scripts/deploy-function.sh send-email    # Deploy one function
./scripts/deploy-function.sh --all         # Deploy all functions
```

## Testing & Security

### setup-testing.sh
Set up testing environment with Vitest.

```bash
./scripts/setup-testing.sh
```

**What it does:**
- Installs testing dependencies (Vitest, @supabase/supabase-js)
- Creates `vitest.config.ts`
- Creates test directory and example tests
- Adds test scripts to `package.json`

**Example:**
```bash
./scripts/setup-testing.sh
```

### run-tests.sh
Run tests with various options.

```bash
./scripts/run-tests.sh [--watch] [--ui] [--coverage]
```

**Flags:**
- `--watch` - Run in watch mode
- `--ui` - Open Vitest UI
- `--coverage` - Generate coverage report

**Example:**
```bash
./scripts/run-tests.sh              # Run once
./scripts/run-tests.sh --watch      # Watch mode
./scripts/run-tests.sh --ui         # Interactive UI
./scripts/run-tests.sh --coverage   # With coverage
```

### test-rls.sh
Test Row Level Security policies for a table.

```bash
./scripts/test-rls.sh <table-name>
```

**What it does:**
- Checks if RLS is enabled on the table
- Lists all policies for the table
- Tests policies as anonymous user
- Tests policies as authenticated user
- Shows visible row counts for each context

**Example:**
```bash
./scripts/test-rls.sh profiles
./scripts/test-rls.sh posts
```

**Tests performed:**
1. RLS status check
2. Policy listing
3. Anonymous user access (no auth.uid())
4. Authenticated user access (with test UUID)

## Common Workflows

### Starting a New Project

```bash
# 1. Set up project
./scripts/setup-project.sh my-app

# 2. Edit .env.local with your Supabase credentials

# 3. Start local development
./scripts/local-dev.sh

# 4. Create your first migration
./scripts/create-migration.sh initial_schema

# 5. Edit the migration file, then apply it
./scripts/run-migrations.sh --local

# 6. Generate TypeScript types
./scripts/generate-types.sh
```

### Local Development Workflow

```bash
# 1. Start Supabase services
./scripts/local-dev.sh

# 2. Make schema changes
./scripts/create-migration.sh add_feature

# 3. Apply migrations
./scripts/run-migrations.sh --local

# 4. Update types
./scripts/generate-types.sh

# 5. Run tests
./scripts/run-tests.sh
```

### Creating and Deploying Edge Functions

```bash
# 1. Create function
./scripts/create-function.sh my-function

# 2. Edit function code
# vim supabase/functions/my-function/index.ts

# 3. Test locally
./scripts/serve-functions.sh

# 4. Deploy to production
./scripts/link-project.sh YOUR_PROJECT_REF
./scripts/deploy-function.sh my-function
```

### Deployment Workflow

```bash
# 1. Run tests
./scripts/run-tests.sh

# 2. Create backup of production (if pulling schema)
./scripts/backup-database.sh

# 3. Link to production project
./scripts/link-project.sh YOUR_PROJECT_REF

# 4. Deploy migrations
./scripts/run-migrations.sh --remote

# 5. Deploy Edge Functions
./scripts/deploy-function.sh --all
```

### Testing RLS Policies

```bash
# 1. Create migration with RLS policies
./scripts/create-migration.sh add_rls_policies

# 2. Apply locally
./scripts/run-migrations.sh --local

# 3. Test policies
./scripts/test-rls.sh my_table

# 4. Iterate until policies work correctly

# 5. Deploy to production
./scripts/run-migrations.sh --remote
```

## Prerequisites

### Required Software

- **Node.js** (v16 or later)
- **Docker** (for local development)
- **Supabase CLI** (installed automatically by setup-project.sh)
- **PostgreSQL client tools** (psql, pg_dump) for some scripts

### Installation

Install Supabase CLI manually:
```bash
npm install -g supabase
```

Or use Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

### Environment Variables

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Script Permissions

All scripts should be executable. If you get permission errors:

```bash
chmod +x scripts/*.sh
```

## Tips

1. **Always test locally first** - Run migrations and test functions locally before deploying to production

2. **Backup before major changes** - Use `backup-database.sh` before running complex migrations

3. **Use seed data** - Create a comprehensive `seed.sql` for consistent testing across your team

4. **Test RLS policies** - Always test RLS policies with `test-rls.sh` before deploying

5. **Generate types after schema changes** - Run `generate-types.sh` after every migration for type safety

6. **Use version control** - Commit migration files and track schema changes in git

7. **Link project for deployment** - Use `link-project.sh` once per environment to enable remote operations

## Troubleshooting

### "Docker is not running"
Start Docker Desktop or Docker daemon before running `local-dev.sh`

### "Supabase CLI not found"
Run `npm install -g supabase` or use the `setup-project.sh` script

### "Permission denied"
Make scripts executable: `chmod +x scripts/*.sh`

### Migration conflicts
Reset local database: `./scripts/local-dev.sh --reset`

### Function deployment fails
Ensure you're logged in and linked: `supabase login && ./scripts/link-project.sh YOUR_REF`

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
