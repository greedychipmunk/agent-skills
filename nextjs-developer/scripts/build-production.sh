#!/bin/bash

# Production Build Script for Next.js
# Creates an optimized production build
# Usage: ./scripts/build-production.sh [--analyze]

set -e

ANALYZE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --analyze|-a)
            ANALYZE="true"
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/build-production.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --analyze, -a    Enable bundle analysis (requires @next/bundle-analyzer)"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "Building Next.js application for production..."
echo ""

# Run type checking first
echo "Step 1: Type checking..."
if npx tsc --noEmit 2>/dev/null; then
    echo "Type checking passed"
else
    echo "Warning: TypeScript errors found (continuing with build)"
fi
echo ""

# Run linting
echo "Step 2: Linting..."
if npx next lint 2>/dev/null; then
    echo "Linting passed"
else
    echo "Warning: Linting errors found (continuing with build)"
fi
echo ""

# Build
echo "Step 3: Building..."
if [ "$ANALYZE" = "true" ]; then
    echo "Bundle analysis enabled"
    ANALYZE=true npx next build
else
    npx next build
fi

echo ""
echo "Build completed successfully!"
echo ""
echo "To start the production server, run:"
echo "  npm start"
echo "  # or"
echo "  npx next start"
