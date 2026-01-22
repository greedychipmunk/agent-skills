#!/bin/bash

# Test Runner Script for Next.js
# Runs Jest tests with various options
# Usage: ./scripts/run-tests.sh [--watch] [--coverage] [--file FILE]

set -e

WATCH=""
COVERAGE=""
FILE=""
UPDATE_SNAPSHOTS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --watch|-w)
            WATCH="--watch"
            shift
            ;;
        --coverage|-c)
            COVERAGE="--coverage"
            shift
            ;;
        --file|-f)
            FILE="$2"
            shift 2
            ;;
        --update|-u)
            UPDATE_SNAPSHOTS="--updateSnapshot"
            shift
            ;;
        --ci)
            COVERAGE="--coverage"
            CI="--ci"
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/run-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --watch, -w       Run tests in watch mode"
            echo "  --coverage, -c    Generate coverage report"
            echo "  --file, -f FILE   Run tests for specific file or pattern"
            echo "  --update, -u      Update Jest snapshots"
            echo "  --ci              Run in CI mode (coverage + no watch)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/run-tests.sh --watch"
            echo "  ./scripts/run-tests.sh --coverage"
            echo "  ./scripts/run-tests.sh --file components/button"
            exit 0
            ;;
        *)
            # Treat unknown args as test file patterns
            FILE="$1"
            shift
            ;;
    esac
done

echo "Running Next.js tests..."
echo ""

# Build the command
CMD="npx jest"

if [ -n "$FILE" ]; then
    CMD="$CMD $FILE"
fi

if [ -n "$WATCH" ]; then
    CMD="$CMD $WATCH"
fi

if [ -n "$COVERAGE" ]; then
    CMD="$CMD $COVERAGE"
fi

if [ -n "$UPDATE_SNAPSHOTS" ]; then
    CMD="$CMD $UPDATE_SNAPSHOTS"
fi

if [ -n "$CI" ]; then
    CMD="$CMD $CI"
fi

echo "Executing: $CMD"
echo ""

$CMD
