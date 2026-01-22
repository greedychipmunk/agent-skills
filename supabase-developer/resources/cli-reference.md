# Supabase CLI Reference

## Installation

### npm/yarn/pnpm
```bash
npm install -g supabase
# or
yarn global add supabase
# or
pnpm add -g supabase
```

### Homebrew (macOS)
```bash
brew install supabase/tap/supabase
```

### Scoop (Windows)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Authentication

### Login
```bash
# Login to Supabase account
supabase login

# Check login status
supabase --version
```

### Access Tokens
- Generate token: https://app.supabase.com/account/tokens
- Token stored in: `~/.supabase/access-token`

## Project Management

### Initialize Project
```bash
# Initialize Supabase in current directory
supabase init

# Creates:
# - supabase/config.toml
# - supabase/seed.sql
# - .gitignore entries
```

### Link to Remote Project
```bash
# Link to existing project
supabase link --project-ref <project-id>

# Get project ID from: Settings > General > Reference ID
```

### Project Information
```bash
# List all projects
supabase projects list

# Create new project
supabase projects create <project-name> --org-id <org-id> --db-password <password>

# Get project details
supabase projects api-keys --project-ref <project-id>
```

## Local Development

### Start Services
```bash
# Start all services (PostgreSQL, Studio, APIs)
supabase start

# Services will be available at:
# - Studio: http://localhost:54323
# - API: http://localhost:54321
# - DB: postgresql://postgres:postgres@localhost:54322/postgres
```

### Stop Services
```bash
# Stop all services
supabase stop

# Stop and reset database
supabase stop --no-backup

# Stop and backup database
supabase stop --backup
```

### Status
```bash
# Check status of all services
supabase status

# Returns URLs and credentials for:
# - API URL
# - DB URL
# - Studio URL
# - Inbucket URL (email testing)
# - anon key
# - service_role key
```

## Database Operations

### Migrations

#### Create Migration
```bash
# Create new migration file
supabase migration new <migration_name>

# Creates: supabase/migrations/YYYYMMDDHHMMSS_migration_name.sql
```

#### Apply Migrations
```bash
# Apply to local database
supabase db push

# Apply to remote database
supabase db push --linked

# Apply specific migration
supabase db push --include-seed
```

#### Migration Status
```bash
# Check migration status
supabase migration list

# Show applied migrations
supabase migration list --local
```

#### Repair Migrations
```bash
# Repair migration history
supabase migration repair <version> --status applied

# Mark migration as applied without running it
supabase migration repair <version> --status reverted
```

### Database Diff
```bash
# Generate migration from database differences
supabase db diff -f <migration_name>

# Compare local with schema file
supabase db diff --use-migra

# Show SQL needed to sync databases
supabase db diff --schema public
```

### Database Reset
```bash
# Reset local database to initial state
supabase db reset

# Reset and apply all migrations
supabase db reset --db-url <connection-string>
```

### Database Dump
```bash
# Dump schema and data
supabase db dump -f dump.sql

# Dump only schema
supabase db dump --schema-only -f schema.sql

# Dump specific schema
supabase db dump --schema public -f public.sql

# Dump data only
supabase db dump --data-only -f data.sql
```

### Database Branching
```bash
# List database branches
supabase branches list

# Create new branch
supabase branches create <branch-name>

# Switch to branch
supabase branches switch <branch-name>

# Delete branch
supabase branches delete <branch-name>
```

### SQL Execution
```bash
# Execute SQL from file
supabase db execute -f script.sql

# Execute SQL from stdin
echo "SELECT * FROM users;" | supabase db execute

# Execute on remote database
supabase db execute -f script.sql --linked
```

## Type Generation

### Generate TypeScript Types
```bash
# Generate from local database
supabase gen types typescript --local > types/database.types.ts

# Generate from remote database
supabase gen types typescript --linked > types/database.types.ts

# Generate for specific schema
supabase gen types typescript --local --schema public > types/public.types.ts
```

### Generate from Project Ref
```bash
# Generate using project reference ID
supabase gen types typescript --project-id <project-ref> > types/database.types.ts
```

## Edge Functions

### Create Function
```bash
# Create new function
supabase functions new <function-name>

# Creates: supabase/functions/<function-name>/index.ts
```

### Serve Functions Locally
```bash
# Serve all functions
supabase functions serve

# Serve specific function
supabase functions serve <function-name>

# Serve with environment variables
supabase functions serve --env-file .env.local

# Serve with debugging
supabase functions serve --debug
```

### Deploy Function
```bash
# Deploy single function
supabase functions deploy <function-name>

# Deploy all functions
supabase functions deploy

# Deploy with no-verify SSL
supabase functions deploy <function-name> --no-verify-jwt

# Deploy with environment variables
supabase functions deploy <function-name> --import-map import_map.json
```

### Delete Function
```bash
# Delete function
supabase functions delete <function-name>
```

### Function Logs
```bash
# View function logs
supabase functions logs <function-name>

# Stream logs
supabase functions logs <function-name> --follow
```

### Environment Secrets
```bash
# Set secret
supabase secrets set KEY=value

# Set multiple secrets
supabase secrets set KEY1=value1 KEY2=value2

# Set from file
supabase secrets set --env-file .env.production

# List secrets (names only)
supabase secrets list

# Unset secret
supabase secrets unset KEY
```

## Storage

### List Buckets
```bash
# List all buckets
supabase storage ls
```

## Testing

### Run Tests
```bash
# Run all tests
supabase test new <test-name>

# Run specific test
supabase test <test-name>
```

## Configuration

### Config File
Location: `supabase/config.toml`

```toml
[api]
port = 54321
schemas = ["public", "storage"]
extra_search_path = ["public", "extensions"]

[db]
port = 54322
major_version = 15

[studio]
port = 54323

[inbucket]
port = 54324
smtp_port = 54325
pop3_port = 54326

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

### Environment Variables
```bash
# Set environment variable for local development
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Advanced Commands

### Database URL
```bash
# Get local database URL
supabase db remote --db-url <connection-string>

# Connect to local database
psql $(supabase db remote --db-url)
```

### Inspect
```bash
# Inspect database
supabase inspect db

# Get database size
supabase inspect db size

# Get table sizes
supabase inspect db tables

# Get index usage
supabase inspect db index-usage

# Get long-running queries
supabase inspect db long-running-queries

# Get cache hit rate
supabase inspect db cache-hit
```

### Bootstrap
```bash
# Bootstrap templates
supabase bootstrap <template-name>

# Available templates:
# - stripe-subscriptions
# - slack-clone
# - todo-list
```

## Global Flags

All commands support these global flags:

```bash
--debug                   # Enable debug output
--workdir <path>          # Working directory (default: current)
--create-ticket          # Create support ticket on error
--no-spinner             # Disable loading spinner
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Stop services and try again
supabase stop
supabase start
```

#### Docker Not Running
```bash
# Start Docker Desktop or Docker daemon
# Then run:
supabase start
```

#### Migration Conflicts
```bash
# Check migration history
supabase migration list

# Repair if needed
supabase migration repair <version> --status applied
```

#### Connection Refused
```bash
# Ensure services are running
supabase status

# Check logs
supabase logs
```

### Getting Help

```bash
# General help
supabase help

# Command-specific help
supabase <command> --help

# Examples:
supabase db --help
supabase functions --help
supabase migration --help
```

## Useful Aliases

Add to your shell profile (`.bashrc`, `.zshrc`):

```bash
# Quick aliases
alias sb='supabase'
alias sbs='supabase start'
alias sbst='supabase stop'
alias sbr='supabase db reset'
alias sbm='supabase migration new'
alias sbp='supabase db push'
alias sbg='supabase gen types typescript --local'
alias sbf='supabase functions'
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Supabase CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Start Supabase
        run: supabase start
      
      - name: Run migrations
        run: supabase db push
      
      - name: Run tests
        run: npm test
      
      - name: Stop Supabase
        run: supabase stop
```

### Deployment Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Deploy migrations
        run: |
          supabase link --project-ref ${{ secrets.PROJECT_REF }}
          supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Deploy functions
        run: supabase functions deploy
```

## Resources

- Official Docs: https://supabase.com/docs/reference/cli
- CLI GitHub: https://github.com/supabase/cli
- Release Notes: https://github.com/supabase/cli/releases
- Community: https://github.com/supabase/supabase/discussions
