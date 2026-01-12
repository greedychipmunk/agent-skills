#!/bin/bash

# Development Server Script for MedusaJS
# Starts the Medusa application in development mode with hot reloading
# Usage: ./scripts/dev-server.sh [--host HOST] [--port PORT]

set -e

ARGS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host|-h)
            ARGS="$ARGS --host $2"
            shift 2
            ;;
        --port|-p)
            ARGS="$ARGS --port $2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./scripts/dev-server.sh [--host HOST] [--port PORT]"
            exit 1
            ;;
    esac
done

echo "Starting Medusa development server..."
echo "The server will watch for file changes and auto-restart"
echo "Admin dashboard will be available with hot reloading"
echo ""

npx medusa develop $ARGS
