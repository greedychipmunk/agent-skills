#!/bin/bash

# Run Migrations Script for MedusaJS
# Runs all pending migrations, syncs links, and runs data migration scripts
# Usage: ./scripts/run-migrations.sh [--skip-links] [--skip-data]

set -e

echo "Running database migrations..."

ARGS=""

# Check for skip links flag
if [[ "$*" == *"--skip-links"* ]]; then
    ARGS="$ARGS --skip-links"
    echo "Skipping link synchronization"
fi

# Check for skip data flag
if [[ "$*" == *"--skip-data"* ]]; then
    ARGS="$ARGS --skip-data"
    echo "Skipping data migration scripts"
fi

npx medusa db:migrate $ARGS

echo "Migrations completed successfully!"
