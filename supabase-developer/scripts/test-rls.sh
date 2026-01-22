#!/bin/bash
# test-rls.sh - Test RLS policies with different user contexts
# Usage: ./test-rls.sh <table-name>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Table name is required"
    echo "Usage: ./test-rls.sh <table-name>"
    echo "Example: ./test-rls.sh profiles"
    exit 1
fi

TABLE_NAME="$1"

echo "🔒 Testing RLS policies for table: $TABLE_NAME"
echo ""

# Validate table name to prevent SQL injection (alphanumeric and underscore only)
if ! [[ "$TABLE_NAME" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
    echo "❌ Error: Invalid table name. Use only letters, numbers, and underscores."
    exit 1
fi

# Create test SQL file
TEST_FILE="/tmp/test-rls-$TABLE_NAME.sql"

cat > "$TEST_FILE" << EOF
-- RLS Policy Testing for $TABLE_NAME
-- This script tests RLS policies from different user perspectives

\echo '=========================================='
\echo 'RLS Policy Test for: $TABLE_NAME'
\echo '=========================================='

-- Check if RLS is enabled
\echo ''
\echo '1. Checking RLS status:'
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = '$TABLE_NAME';

-- List all policies
\echo ''
\echo '2. Listing all policies:'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies
WHERE tablename = '$TABLE_NAME'
ORDER BY policyname;

-- Test as anonymous user (no auth.uid())
\echo ''
\echo '3. Testing SELECT as anonymous user:'
BEGIN;
SET LOCAL role TO anon;
SET LOCAL request.jwt.claim.sub TO '';
SELECT COUNT(*) as rows_visible FROM "$TABLE_NAME";
ROLLBACK;

-- Test as authenticated user
\echo ''
\echo '4. Testing SELECT as authenticated user:'
\echo '   (Using test UUID: 00000000-0000-0000-0000-000000000001)'
BEGIN;
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '00000000-0000-0000-0000-000000000001';
SELECT COUNT(*) as rows_visible FROM "$TABLE_NAME";
ROLLBACK;

\echo ''
\echo '=========================================='
\echo 'RLS Test Complete'
\echo '=========================================='
EOF

# Run the test
echo "Running RLS tests..."
psql -h localhost -p 54322 -U postgres -d postgres -f "$TEST_FILE"

# Cleanup
rm "$TEST_FILE"

echo ""
echo "✅ RLS policy test completed!"
echo ""
echo "💡 Tips:"
echo "   - Add custom test queries to verify specific policies"
echo "   - Test INSERT, UPDATE, and DELETE operations"
echo "   - Use different user UUIDs to test user-specific policies"
echo "   - Check that unauthorized access is properly blocked"
