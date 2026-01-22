#!/bin/bash
# create-function.sh - Create a new Edge Function with boilerplate
# Usage: ./create-function.sh <function-name>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Function name is required"
    echo "Usage: ./create-function.sh <function-name>"
    echo "Example: ./create-function.sh send-email"
    exit 1
fi

FUNCTION_NAME="$1"

echo "📝 Creating Edge Function: $FUNCTION_NAME"

# Create function using Supabase CLI
supabase functions new "$FUNCTION_NAME"

# Replace default content with better boilerplate
cat > "supabase/functions/$FUNCTION_NAME/index.ts" << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  // Define your request body type here
  [key: string]: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const body: RequestBody = await req.json()

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error) {
        throw new Error('Unauthorized')
      }
      
      // User is authenticated, proceed with your logic
      console.log('Authenticated user:', user.id)
    }

    // Your function logic here
    const result = {
      success: true,
      message: 'Function executed successfully',
      data: body,
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
EOF

echo "✅ Edge Function created: supabase/functions/$FUNCTION_NAME/index.ts"
echo ""
echo "Next steps:"
echo "1. Edit the function with your logic"
echo "2. Run './scripts/serve-functions.sh' to test locally"
echo "3. Run './scripts/deploy-function.sh $FUNCTION_NAME' to deploy"
