#!/bin/bash
# local-dev.sh - Start local Supabase development environment
# Usage: ./local-dev.sh [--reset]

set -e

RESET=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset)
            RESET=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./local-dev.sh [--reset]"
            exit 1
            ;;
    esac
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Reset database if requested
if [ "$RESET" = true ]; then
    echo "🔄 Resetting local database..."
    supabase db reset
fi

# Start Supabase services
echo "🚀 Starting local Supabase services..."
supabase start

# Display connection info
echo ""
echo "✅ Supabase is running locally!"
echo ""
echo "📊 Services:"
supabase status

echo ""
echo "🔗 Quick links:"
echo "   Studio: http://localhost:54323"
echo "   API: http://localhost:54321"
echo ""
echo "💡 Tips:"
echo "   - Use 'supabase stop' to stop services"
echo "   - Use 'supabase db reset' to reset database"
echo "   - Use './scripts/generate-types.sh' to generate TypeScript types"
