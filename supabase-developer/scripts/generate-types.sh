#!/bin/bash
# generate-types.sh - Generate TypeScript types from database schema
# Usage: ./generate-types.sh [--output PATH]

set -e

OUTPUT_PATH="src/types/database.types.ts"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            OUTPUT_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./generate-types.sh [--output PATH]"
            exit 1
            ;;
    esac
done

echo "🔧 Generating TypeScript types from database schema..."

# Create directory if it doesn't exist
mkdir -p "$(dirname "$OUTPUT_PATH")"

# Generate types
supabase gen types typescript --local > "$OUTPUT_PATH"

echo "✅ TypeScript types generated at: $OUTPUT_PATH"
echo ""
echo "💡 Import types in your code:"
echo "   import type { Database } from '@/types/database.types'"
