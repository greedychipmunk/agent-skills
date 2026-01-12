#!/bin/bash

# Generate Migration Script for MedusaJS
# Generates migration files for specified modules
# Usage: ./scripts/generate-migration.sh <module-name> [additional-modules...]

set -e

if [ $# -eq 0 ]; then
    echo "Error: Module name(s) required"
    echo "Usage: ./scripts/generate-migration.sh <module-name> [additional-modules...]"
    echo "Example: ./scripts/generate-migration.sh blog"
    echo "Example: ./scripts/generate-migration.sh blog product-custom"
    exit 1
fi

echo "Generating migrations for module(s): $@"

npx medusa db:generate "$@"

echo "Migration generation completed!"
echo "Check the migrations directory in your module(s) for generated files"
