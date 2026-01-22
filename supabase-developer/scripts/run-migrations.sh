#!/bin/bash
# run-migrations.sh - Apply pending migrations
# Usage: ./run-migrations.sh [--local|--remote]

set -e

TARGET="local"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            TARGET="local"
            shift
            ;;
        --remote)
            TARGET="remote"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./run-migrations.sh [--local|--remote]"
            exit 1
            ;;
    esac
done

if [ "$TARGET" = "local" ]; then
    echo "🔄 Running migrations on local database..."
    supabase db push
    echo "✅ Local migrations applied successfully!"
else
    echo "🚀 Running migrations on remote database..."
    echo "⚠️  This will modify your production database!"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase db push --linked
        echo "✅ Remote migrations applied successfully!"
    else
        echo "❌ Migration cancelled"
        exit 1
    fi
fi

echo ""
echo "💡 Don't forget to run './scripts/generate-types.sh' to update TypeScript types"
