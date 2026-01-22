#!/bin/bash

# Development Server Script for Next.js
# Starts the Next.js application in development mode with hot reloading
# Usage: ./scripts/dev-server.sh [--port PORT] [--turbo]

set -e

PORT=3000
USE_TURBO=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --turbo|-t)
            USE_TURBO="--turbo"
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/dev-server.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --port, -p PORT    Port to run the server on (default: 3000)"
            echo "  --turbo, -t        Enable Turbopack for faster development"
            echo "  --help, -h         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "Starting Next.js development server..."
echo "Port: $PORT"
if [ -n "$USE_TURBO" ]; then
    echo "Turbopack: enabled"
fi
echo ""
echo "The server will watch for file changes and auto-refresh"
echo "Press Ctrl+C to stop the server"
echo ""

npx next dev --port "$PORT" $USE_TURBO
