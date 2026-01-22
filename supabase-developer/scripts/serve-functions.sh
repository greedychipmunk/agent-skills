#!/bin/bash
# serve-functions.sh - Run Edge Functions locally for testing
# Usage: ./serve-functions.sh

set -e

echo "🔧 Starting local Edge Functions server..."

# Check if .env file exists for function secrets
if [ -f "supabase/.env" ]; then
    echo "📋 Loading environment variables from supabase/.env"
else
    echo "⚠️  No supabase/.env file found"
    echo "💡 Create supabase/.env to add environment variables for your functions"
fi

echo ""
echo "🚀 Edge Functions are now serving on http://localhost:54321/functions/v1"
echo ""
echo "💡 Example curl command:"
echo "   curl -i --location --request POST 'http://localhost:54321/functions/v1/[function-name]' \\"
echo "     --header 'Authorization: Bearer [ANON_KEY]' \\"
echo "     --header 'Content-Type: application/json' \\"
echo "     --data '{\"key\":\"value\"}'"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Serve functions locally
supabase functions serve
