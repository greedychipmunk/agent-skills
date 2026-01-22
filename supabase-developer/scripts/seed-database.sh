#!/bin/bash
# seed-database.sh - Seed database with test data
# Usage: ./seed-database.sh

set -e

SEED_FILE="supabase/seed.sql"

if [ ! -f "$SEED_FILE" ]; then
    echo "⚠️  Seed file not found at $SEED_FILE"
    echo "📝 Creating a template seed file..."
    
    cat > "$SEED_FILE" << 'EOF'
-- Seed data for local development and testing

-- Example: Insert test users into profiles table
-- insert into public.profiles (id, username, full_name, avatar_url)
-- values
--   ('00000000-0000-0000-0000-000000000001', 'testuser1', 'Test User 1', 'https://example.com/avatar1.jpg'),
--   ('00000000-0000-0000-0000-000000000002', 'testuser2', 'Test User 2', 'https://example.com/avatar2.jpg');

-- Add your seed data here
EOF
    
    echo "✅ Template seed file created at $SEED_FILE"
    echo "Edit the file and run this script again to apply seed data"
    exit 0
fi

echo "🌱 Seeding database with test data..."

# Apply seed file to local database
psql -h localhost -p 54322 -U postgres -d postgres -f "$SEED_FILE"

echo "✅ Database seeded successfully!"
