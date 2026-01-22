#!/bin/bash
# deploy-function.sh - Deploy Edge Function to production
# Usage: ./deploy-function.sh <function-name> [--all]

set -e

DEPLOY_ALL=false
FUNCTION_NAME=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            DEPLOY_ALL=true
            shift
            ;;
        *)
            FUNCTION_NAME="$1"
            shift
            ;;
    esac
done

if [ "$DEPLOY_ALL" = false ] && [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Error: Function name is required"
    echo "Usage: ./deploy-function.sh <function-name> [--all]"
    echo "Example: ./deploy-function.sh send-email"
    echo "         ./deploy-function.sh --all"
    exit 1
fi

if [ "$DEPLOY_ALL" = true ]; then
    echo "🚀 Deploying all Edge Functions..."
    
    # Get list of all functions
    FUNCTIONS=$(ls -d supabase/functions/*/ 2>/dev/null | xargs -n 1 basename)
    
    if [ -z "$FUNCTIONS" ]; then
        echo "❌ No functions found in supabase/functions/"
        exit 1
    fi
    
    for FUNC in $FUNCTIONS; do
        if [ "$FUNC" != "_shared" ]; then
            echo "📦 Deploying: $FUNC"
            supabase functions deploy "$FUNC"
        fi
    done
    
    echo "✅ All functions deployed successfully!"
else
    if [ ! -d "supabase/functions/$FUNCTION_NAME" ]; then
        echo "❌ Function not found: $FUNCTION_NAME"
        exit 1
    fi
    
    echo "🚀 Deploying Edge Function: $FUNCTION_NAME"
    supabase functions deploy "$FUNCTION_NAME"
    echo "✅ Function deployed successfully!"
fi

echo ""
echo "💡 Test your function:"
echo "   curl -i --location --request POST 'https://[PROJECT_REF].functions.supabase.co/$FUNCTION_NAME' \\"
echo "     --header 'Authorization: Bearer [ANON_KEY]' \\"
echo "     --header 'Content-Type: application/json' \\"
echo "     --data '{\"key\":\"value\"}'"
