#!/bin/bash
# setup-testing.sh - Set up testing environment for Supabase project
# Usage: ./setup-testing.sh

set -e

echo "🧪 Setting up testing environment..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please initialize your project first."
    exit 1
fi

# Install testing dependencies
echo "📦 Installing testing dependencies..."
npm install --save-dev \
    @supabase/supabase-js \
    vitest \
    @vitest/ui \
    dotenv

# Create test directory
mkdir -p tests

# Create vitest config
if [ ! -f "vitest.config.ts" ]; then
    echo "📝 Creating vitest.config.ts..."
    cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
})
EOF
fi

# Create test setup file
if [ ! -f "tests/setup.ts" ]; then
    echo "📝 Creating tests/setup.ts..."
    cat > tests/setup.ts << 'EOF'
import { config } from 'dotenv'

// Load environment variables for testing
config({ path: '.env.local' })

// Global test setup
beforeAll(() => {
  // Setup code that runs before all tests
})

afterAll(() => {
  // Cleanup code that runs after all tests
})
EOF
fi

# Create example test file
if [ ! -f "tests/example.test.ts" ]; then
    echo "📝 Creating tests/example.test.ts..."
    cat > tests/example.test.ts << 'EOF'
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Supabase Connection', () => {
  it('should connect to Supabase', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(supabaseUrl).toBeDefined()
    expect(supabaseKey).toBeDefined()

    const supabase = createClient(supabaseUrl!, supabaseKey!)
    expect(supabase).toBeDefined()
  })
})
EOF
fi

# Add test scripts to package.json if not present
if ! grep -q '"test"' package.json; then
    echo "📝 Adding test scripts to package.json..."
    # Use jq if available, otherwise use sed
    if command -v jq &> /dev/null; then
        jq '.scripts.test = "vitest" | .scripts["test:ui"] = "vitest --ui" | .scripts["test:coverage"] = "vitest --coverage"' package.json > package.json.tmp
        mv package.json.tmp package.json
    else
        echo "⚠️  Please manually add these scripts to package.json:"
        echo '  "test": "vitest"'
        echo '  "test:ui": "vitest --ui"'
        echo '  "test:coverage": "vitest --coverage"'
    fi
fi

echo "✅ Testing environment set up successfully!"
echo ""
echo "💡 Run tests with:"
echo "   npm test              - Run all tests"
echo "   npm run test:ui       - Run tests with UI"
echo "   npm run test:coverage - Run tests with coverage"
