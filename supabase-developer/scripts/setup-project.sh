#!/bin/bash
# setup-project.sh - Initialize a new Supabase project with configuration
# Usage: ./setup-project.sh <project-name>

set -e

PROJECT_NAME="${1:-my-supabase-project}"

echo "🚀 Setting up Supabase project: $PROJECT_NAME"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Initialize Supabase project
echo "📦 Initializing Supabase project..."
supabase init

# Create project structure
echo "📁 Creating project structure..."
mkdir -p supabase/functions/_shared
mkdir -p src/lib
mkdir -p src/types

# Create config file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local template..."
    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
    echo "⚠️  Remember to update .env.local with your actual Supabase credentials"
fi

# Create .gitignore additions
if [ -f ".gitignore" ]; then
    if ! grep -q ".env.local" .gitignore; then
        echo "" >> .gitignore
        echo "# Supabase" >> .gitignore
        echo ".env.local" >> .gitignore
        echo ".env*.local" >> .gitignore
        echo "supabase/.branches" >> .gitignore
        echo "supabase/.temp" >> .gitignore
    fi
fi

echo "✅ Supabase project '$PROJECT_NAME' initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run './scripts/local-dev.sh' to start local development"
echo "3. Create your first migration with './scripts/create-migration.sh'"
