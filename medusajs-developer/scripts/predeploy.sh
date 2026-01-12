#!/bin/bash

# Pre-deployment Script for MedusaJS
# Runs migrations and syncs links before starting the application
# Usage: ./scripts/predeploy.sh

set -e

echo "Running pre-deployment tasks..."

# Run migrations with safe options
echo "1. Running database migrations..."
npx medusa db:migrate --safe

echo "Pre-deployment completed successfully!"
echo "Application is ready to start"
