#!/bin/bash

# Plugin Build Script for MedusaJS
# Builds a plugin for publishing to NPM
# Usage: ./scripts/plugin-build.sh (run from plugin directory)

set -e

# Check if we're in a plugin directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Are you in a plugin directory?"
    exit 1
fi

echo "Building plugin for production..."

npx medusa plugin:build

echo ""
echo "Plugin build completed!"
echo "Build output: ./dist"
echo ""
echo "Next steps:"
echo "1. Test the plugin build"
echo "2. Update package.json version"
echo "3. Publish to NPM: npm publish"
