#!/bin/bash

# Plugin Development Script for MedusaJS
# Starts a development server for a plugin with auto-reload
# Usage: ./scripts/plugin-develop.sh (run from plugin directory)

set -e

# Check if we're in a plugin directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Are you in a plugin directory?"
    exit 1
fi

echo "Starting plugin development server..."
echo "Changes will be automatically published to local package registry"
echo ""

npx medusa plugin:develop
