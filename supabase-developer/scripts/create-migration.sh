#!/bin/bash
# create-migration.sh - Create a new timestamped migration file
# Usage: ./create-migration.sh <migration-name>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Migration name is required"
    echo "Usage: ./create-migration.sh <migration-name>"
    echo "Example: ./create-migration.sh add_profiles_table"
    exit 1
fi

MIGRATION_NAME="$1"

echo "📝 Creating migration: $MIGRATION_NAME"

# Create migration using Supabase CLI
supabase migration new "$MIGRATION_NAME"

# Find the newly created migration file
MIGRATION_FILE=$(ls -t supabase/migrations/*.sql | head -n 1)

echo "✅ Migration file created: $MIGRATION_FILE"
echo ""
echo "Next steps:"
echo "1. Edit the migration file with your SQL changes"
echo "2. Run './scripts/run-migrations.sh --local' to apply locally"
echo "3. Test your changes thoroughly"
echo "4. Run './scripts/run-migrations.sh --remote' to deploy to production"
