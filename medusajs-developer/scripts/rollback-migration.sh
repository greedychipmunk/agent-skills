#!/bin/bash

# Rollback Migration Script for MedusaJS
# Reverts the last migrations for specified modules
# Usage: ./scripts/rollback-migration.sh <module-name> [additional-modules...]

set -e

if [ $# -eq 0 ]; then
    echo "Error: Module name(s) required"
    echo "Usage: ./scripts/rollback-migration.sh <module-name> [additional-modules...]"
    echo "Example: ./scripts/rollback-migration.sh blog"
    echo "Example: ./scripts/rollback-migration.sh blog product-custom"
    exit 1
fi

echo "Rolling back migrations for module(s): $@"
echo "WARNING: This will revert the last migration for the specified module(s)"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 1
fi

npx medusa db:rollback "$@"

echo "Rollback completed!"
