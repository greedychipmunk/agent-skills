// edge-function-complete.ts
// Complete Edge Function template with common patterns
// Place in: supabase/functions/[function-name]/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../_shared/database.types.ts'

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface RequestBody {
  action?: string
  data?: any
  [key: string]: any
}

interface ResponseData {
  success: boolean
  message?: string
  data?: any
  error?: string
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Create Supabase client with service role
 * ⚠️ This client bypasses RLS - use with caution
 */
function createServiceClient() {
  return createClient<Database>(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

/**
 * Create Supabase client with user context
 * This respects RLS policies
 */
function createUserClient(authHeader: string | null) {
  return createClient<Database>(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Get authenticated user from request
 */
async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }

  const supabase = createUserClient(authHeader)
  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Get optional authenticated user (doesn't throw if not authenticated)
 */
async function getOptionalUser(req: Request) {
  try {
    return await getAuthenticatedUser(req)
  } catch {
    return null
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate request body
 */
function validateRequestBody(body: any, requiredFields: string[]): body is RequestBody {
  for (const field of requiredFields) {
    if (!(field in body)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  return true
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Create error response
 */
function errorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({ 
      success: false,
      error: message 
    }),
    {
      status,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    }
  )
}

/**
 * Create success response
 */
function successResponse(data: any, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data,
    }),
    {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    }
  )
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details (remove in production if sensitive)
    console.log('Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    })

    // Get authenticated user (required)
    const user = await getAuthenticatedUser(req)
    console.log('Authenticated user:', user.id)

    // For optional auth, use:
    // const user = await getOptionalUser(req)

    // Parse request body
    let body: RequestBody = {}
    
    if (req.method !== 'GET') {
      try {
        body = await req.json()
      } catch {
        return errorResponse('Invalid JSON body')
      }
    }

    // Validate required fields
    // validateRequestBody(body, ['action', 'data'])

    // Create Supabase clients
    const supabase = createUserClient(req.headers.get('Authorization'))
    // const adminSupabase = createServiceClient() // Use with caution

    // =============================================================================
    // ROUTE HANDLERS
    // =============================================================================

    switch (req.method) {
      case 'GET': {
        // Handle GET requests
        const url = new URL(req.url)
        const id = url.searchParams.get('id')

        if (!id) {
          return errorResponse('Missing id parameter')
        }

        const { data, error } = await supabase
          .from('your_table')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        return successResponse(data)
      }

      case 'POST': {
        // Handle POST requests
        const { action, data: requestData } = body

        switch (action) {
          case 'create': {
            // Create operation
            const { data, error } = await supabase
              .from('your_table')
              .insert({
                ...requestData,
                user_id: user.id,
              })
              .select()
              .single()

            if (error) throw error

            return successResponse(data, 'Created successfully')
          }

          case 'update': {
            // Update operation
            const { id, ...updates } = requestData

            if (!id) {
              return errorResponse('Missing id')
            }

            const { data, error } = await supabase
              .from('your_table')
              .update(updates)
              .eq('id', id)
              .eq('user_id', user.id) // Ensure user owns the record
              .select()
              .single()

            if (error) throw error

            return successResponse(data, 'Updated successfully')
          }

          case 'delete': {
            // Delete operation
            const { id } = requestData

            if (!id) {
              return errorResponse('Missing id')
            }

            const { error } = await supabase
              .from('your_table')
              .delete()
              .eq('id', id)
              .eq('user_id', user.id) // Ensure user owns the record

            if (error) throw error

            return successResponse(null, 'Deleted successfully')
          }

          default:
            return errorResponse('Invalid action')
        }
      }

      case 'PUT': {
        // Handle PUT requests
        const { id, ...updates } = body

        if (!id) {
          return errorResponse('Missing id')
        }

        const { data, error } = await supabase
          .from('your_table')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        return successResponse(data, 'Updated successfully')
      }

      case 'DELETE': {
        // Handle DELETE requests
        const url = new URL(req.url)
        const id = url.searchParams.get('id')

        if (!id) {
          return errorResponse('Missing id parameter')
        }

        const { error } = await supabase
          .from('your_table')
          .delete()
          .eq('id', id)

        if (error) throw error

        return successResponse(null, 'Deleted successfully')
      }

      default:
        return errorResponse('Method not allowed', 405)
    }

  } catch (error) {
    console.error('Function error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return errorResponse('Unauthorized', 401)
      }
      if (error.message === 'Missing authorization header') {
        return errorResponse('Missing authorization header', 401)
      }
      
      return errorResponse(error.message, 400)
    }

    return errorResponse('Internal server error', 500)
  }
})

// =============================================================================
// COMMON PATTERNS
// =============================================================================

/*
// 1. WEBHOOK HANDLER PATTERN
async function handleWebhook(req: Request) {
  // Verify webhook signature
  const signature = req.headers.get('x-webhook-signature')
  const secret = Deno.env.get('WEBHOOK_SECRET')
  
  if (!verifySignature(await req.text(), signature, secret)) {
    throw new Error('Invalid signature')
  }
  
  const payload = await req.json()
  // Process webhook payload
}

// 2. SCHEDULED TASK PATTERN (with pg_cron)
async function scheduledTask() {
  const supabase = createServiceClient()
  
  // Perform scheduled operation
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'completed' })
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString())
  
  if (error) throw error
  
  console.log(`Updated ${data?.length} tasks`)
}

// 3. EMAIL SENDING PATTERN
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to,
      subject,
      html,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to send email')
  }
  
  return await response.json()
}

// 4. EXTERNAL API INTEGRATION
async function callExternalAPI(endpoint: string, data: any) {
  const apiKey = Deno.env.get('EXTERNAL_API_KEY')
  
  const response = await fetch(`https://api.external.com${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  
  return await response.json()
}

// 5. RATE LIMITING PATTERN
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string, maxRequests: number = 10, windowMs: number = 60000) {
  const now = Date.now()
  const userLimit = rateLimits.get(userId)
  
  if (!userLimit || userLimit.resetAt < now) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (userLimit.count >= maxRequests) {
    throw new Error('Rate limit exceeded')
  }
  
  userLimit.count++
  return true
}

// 6. FILE UPLOAD TO STORAGE
async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
  
  if (error) throw error
  
  return data
}

// 7. REALTIME BROADCAST
async function broadcastMessage(channel: string, event: string, payload: any) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .channel(channel)
    .send({
      type: 'broadcast',
      event,
      payload,
    })
  
  if (error) throw error
}
*/
