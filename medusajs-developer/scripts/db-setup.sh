#!/bin/bash

# Database Setup Script for MedusaJS
# Creates a database, runs migrations, and syncs links
# Usage: ./scripts/db-setup.sh [database-name]

set -e

DB_NAME=${1:-medusa-store}

echo "Setting up database: $DB_NAME"

# Create database and run migrations
npx medusa db:setup --db "$DB_NAME"

echo "Database setup completed successfully!"
echo "Database name: $DB_NAME"
