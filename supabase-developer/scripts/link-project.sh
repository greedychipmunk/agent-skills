#!/bin/bash
# link-project.sh - Link local project to remote Supabase project
# Usage: ./link-project.sh <project-ref>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Project reference is required"
    echo "Usage: ./link-project.sh <project-ref>"
    echo ""
    echo "Get your project reference from:"
    echo "  https://app.supabase.com/project/_/settings/general"
    exit 1
fi

PROJECT_REF="$1"

echo "🔗 Linking to Supabase project: $PROJECT_REF"

# Check if already logged in
if ! supabase projects list &> /dev/null; then
    echo "Please log in to Supabase:"
    supabase login
fi

# Link to project
supabase link --project-ref "$PROJECT_REF"

echo "✅ Successfully linked to project!"
echo ""
echo "Next steps:"
echo "1. Pull remote schema: supabase db pull"
echo "2. Push local changes: supabase db push --linked"
echo "3. Deploy functions: ./scripts/deploy-function.sh --all"
