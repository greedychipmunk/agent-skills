# MedusaJS Developer Scripts

A collection of helper scripts to streamline MedusaJS development workflows. All scripts are based on official MedusaJS CLI commands and best practices.

## Quick Start

All scripts are located in the `scripts/` directory and can be executed from the root of your MedusaJS project.

```bash
# Make scripts executable (if needed)
chmod +x scripts/*.sh

# Example: Create a new module
./scripts/create-module.sh blog
```

## Script Categories

### 🗄️ Database Management

| Script | Purpose | Usage |
|--------|---------|-------|
| `db-setup.sh` | Setup database with migrations | `./scripts/db-setup.sh [db-name]` |
| `generate-migration.sh` | Generate migration files | `./scripts/generate-migration.sh <module-name>` |
| `run-migrations.sh` | Run pending migrations | `./scripts/run-migrations.sh [--skip-links]` |
| `rollback-migration.sh` | Rollback module migrations | `./scripts/rollback-migration.sh <module-name>` |

### 🚀 Development & Build

| Script | Purpose | Usage |
|--------|---------|-------|
| `dev-server.sh` | Start dev server with hot reload | `./scripts/dev-server.sh [--host HOST] [--port PORT]` |
| `build-production.sh` | Build for production | `./scripts/build-production.sh [--admin-only]` |
| `start-production.sh` | Start production server | `./scripts/start-production.sh` |
| `predeploy.sh` | Pre-deployment tasks (CI/CD) | `./scripts/predeploy.sh` |

### 🧪 Testing

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-testing.sh` | Configure Jest & test tools | `./scripts/setup-testing.sh` |
| `run-tests.sh` | Run tests (http/modules/unit) | `./scripts/run-tests.sh [http\|modules\|unit\|all]` |

### 🏗️ Scaffolding

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-module.sh` | Create new custom module | `./scripts/create-module.sh <module-name>` |
| `create-api-route.sh` | Create CRUD API route | `./scripts/create-api-route.sh <route-name>` |
| `create-scheduled-job.sh` | Create cron job | `./scripts/create-scheduled-job.sh <job-name>` |

### 🔌 Plugin Development

| Script | Purpose | Usage |
|--------|---------|-------|
| `plugin-develop.sh` | Dev server for plugins | `./scripts/plugin-develop.sh` |
| `plugin-build.sh` | Build plugin for NPM | `./scripts/plugin-build.sh` |

## Common Workflows

### New Module Development

```bash
# Create module
./scripts/create-module.sh product-reviews

# Add models in src/modules/product-reviews/models/

# Generate & run migrations
./scripts/generate-migration.sh product-reviews
./scripts/run-migrations.sh

# Create API endpoints
./scripts/create-api-route.sh product-reviews

# Test the module
./scripts/run-tests.sh modules
```

### API Development

```bash
# Create API route
./scripts/create-api-route.sh notifications

# Edit route handlers in src/api/notifications/route.ts

# Start dev server to test
./scripts/dev-server.sh

# Test endpoints at http://localhost:9000/api/notifications
```

### Adding Scheduled Tasks

```bash
# Create scheduled job
./scripts/create-scheduled-job.sh daily-report

# Edit job logic in src/jobs/daily-report.ts

# Configure cron schedule in config object

# Restart dev server
./scripts/dev-server.sh
```

### Production Deployment

```bash
# Run full test suite
./scripts/run-tests.sh all

# Build for production
./scripts/build-production.sh

# Deploy and run predeploy tasks
./scripts/predeploy.sh

# Start production server
./scripts/start-production.sh
```

## Environment Variables

Ensure you have these environment variables configured:

```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/medusa-db

# Server
PORT=9000
HOST=localhost

# CORS
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:7001
AUTH_CORS=http://localhost:8000,http://localhost:7001

# Secrets (generate secure random strings)
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret

# Redis (for production)
REDIS_URL=redis://localhost:6379
```

## Cron Schedule Reference

Common cron patterns for scheduled jobs:

```bash
"* * * * *"      # Every minute
"*/5 * * * *"    # Every 5 minutes
"*/15 * * * *"   # Every 15 minutes
"0 * * * *"      # Every hour
"0 */6 * * *"    # Every 6 hours
"0 0 * * *"      # Daily at midnight
"0 9 * * *"      # Daily at 9 AM
"0 0 * * 0"      # Weekly on Sunday
"0 0 1 * *"      # Monthly on 1st day
"0 9 * * 1-5"    # Weekdays at 9 AM
```

Visit [crontab.guru](https://crontab.guru/) for help creating cron expressions.

## Requirements

- Node.js 18+
- PostgreSQL database
- MedusaJS v2.x
- Git (for version control)

## Troubleshooting

### Permission Denied

```bash
chmod +x scripts/*.sh
```

### Script Not Found

Ensure you're running scripts from the project root:

```bash
# Wrong
cd scripts && ./db-setup.sh

# Correct
./scripts/db-setup.sh
```

### Migration Errors

```bash
# Rollback and try again
./scripts/rollback-migration.sh <module-name>
./scripts/generate-migration.sh <module-name>
./scripts/run-migrations.sh
```

## Contributing

These scripts follow official MedusaJS CLI commands and patterns. For issues or improvements, refer to:

- [MedusaJS Documentation](https://docs.medusajs.com/)
- [Medusa CLI Reference](https://docs.medusajs.com/resources/medusa-cli)
- [Testing Documentation](https://docs.medusajs.com/learn/debugging-and-testing/testing-tools)

## License

MIT - Use freely in your MedusaJS projects.
