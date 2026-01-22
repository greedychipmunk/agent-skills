#!/bin/bash
# run-tests.sh - Run tests for Supabase project
# Usage: ./run-tests.sh [--watch] [--ui] [--coverage]

set -e

WATCH=false
UI=false
COVERAGE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH=true
            shift
            ;;
        --ui)
            UI=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./run-tests.sh [--watch] [--ui] [--coverage]"
            exit 1
            ;;
    esac
done

echo "🧪 Running tests..."

# Build command
CMD="npm test"

if [ "$UI" = true ]; then
    CMD="npm run test:ui"
elif [ "$COVERAGE" = true ]; then
    CMD="npm run test:coverage"
elif [ "$WATCH" = true ]; then
    CMD="npm test -- --watch"
fi

# Run tests
$CMD
