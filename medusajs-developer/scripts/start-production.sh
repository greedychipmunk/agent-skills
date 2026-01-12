#!/bin/bash

# Start Production Server Script for MedusaJS
# Starts the built Medusa application in production mode
# Usage: ./scripts/start-production.sh

set -e

BUILD_DIR=".medusa/server"

if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: Build directory not found at $BUILD_DIR"
    echo "Please run: ./scripts/build-production.sh first"
    exit 1
fi

echo "Starting Medusa production server..."

cd "$BUILD_DIR"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Copy .env file if it doesn't exist
if [ ! -f ".env.production" ] && [ -f "../../.env" ]; then
    echo "Copying environment variables..."
    cp ../../.env .env.production
fi

# Set NODE_ENV and start
export NODE_ENV=production
npm run start
