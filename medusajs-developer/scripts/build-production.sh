#!/bin/bash

# Production Build Script for MedusaJS
# Creates a production-ready build of the Medusa application
# Usage: ./scripts/build-production.sh [--admin-only]

set -e

ARGS=""

# Check for admin-only flag
if [[ "$*" == *"--admin-only"* ]]; then
    ARGS="--admin-only"
    echo "Building admin only for separate hosting..."
else
    echo "Building full Medusa application for production..."
fi

npx medusa build $ARGS

if [[ "$*" == *"--admin-only"* ]]; then
    echo "Admin build completed!"
    echo "Build output: ./build"
    echo "You can now deploy the admin separately (e.g., to Vercel)"
else
    echo "Production build completed!"
    echo "Build output: ./.medusa/server"
    echo ""
    echo "Next steps:"
    echo "1. cd .medusa/server && npm install"
    echo "2. Copy your .env file: cp ../../.env .env.production"
    echo "3. Set NODE_ENV=production"
    echo "4. Start the server: npm run start"
fi
