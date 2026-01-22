# Edge Functions

## Overview

Supabase Edge Functions are server-side TypeScript/JavaScript functions that run on Deno Deploy. They enable:
- Custom API endpoints
- Webhook handlers
- Third-party integrations
- Scheduled tasks
- Background processing

## Project Structure

```
supabase/
├── functions/
│   ├── hello-world/
│   │   └── index.ts
│   ├── send-email/
│   │   └── index.ts
│   ├── webhook-handler/
│   │   └── index.ts
│   └── _shared/
│       ├── cors.ts
│       ├── supabase-client.ts
│       └── validation.ts
└── config.toml
```

## Basic Function Structure

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const { name } = await req.json()

  return new Response(
    JSON.stringify({ message: `Hello, ${name}!` }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    }
  )
})
```

## CORS Handling

### Shared CORS Module
```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

### Using CORS
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Your logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## Supabase Client in Functions

### Service Role Client
```typescript
// supabase/functions/_shared/supabase-client.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader }
      }
    }
  )
}
```

### Using Authenticated User Context
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createUserClient } from '../_shared/supabase-client.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createUserClient(authHeader)

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // User is authenticated, proceed with logic
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.id)

  return new Response(
    JSON.stringify({ posts: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

## Request Handling

### HTTP Methods
```typescript
serve(async (req) => {
  const { method, url } = req
  const path = new URL(url).pathname

  switch (method) {
    case 'GET':
      return handleGet(req)
    case 'POST':
      return handlePost(req)
    case 'PUT':
      return handlePut(req)
    case 'DELETE':
      return handleDelete(req)
    default:
      return new Response('Method not allowed', { status: 405 })
  }
})
```

### Query Parameters
```typescript
serve(async (req) => {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const search = url.searchParams.get('search')

  // Use parameters...
})
```

### Request Body
```typescript
serve(async (req) => {
  // JSON body
  const body = await req.json()

  // Form data
  const formData = await req.formData()
  const file = formData.get('file') as File

  // Text body
  const text = await req.text()

  // Raw bytes
  const bytes = await req.arrayBuffer()
})
```

## Input Validation

```typescript
// Using Zod for validation
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  published: z.boolean().default(false)
})

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const body = await req.json()
    const data = CreatePostSchema.parse(body)

    // data is now typed and validated
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    throw error
  }
})
```

## Webhook Handling

### Stripe Webhook
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno'
import { createServiceClient } from '../_shared/supabase-client.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('stripe_session_id', session.id)
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000)
        })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

### GitHub Webhook
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'

serve(async (req) => {
  const event = req.headers.get('x-github-event')
  const payload = await req.json()

  const supabase = createServiceClient()

  switch (event) {
    case 'push':
      await supabase.from('deployments').insert({
        repo: payload.repository.full_name,
        commit: payload.head_commit.id,
        message: payload.head_commit.message,
        pusher: payload.pusher.name
      })
      break
    case 'issues':
      if (payload.action === 'opened') {
        // Handle new issue
      }
      break
  }

  return new Response('OK', { status: 200 })
})
```

## Third-Party API Integration

### Email with Resend
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const { to, subject, html } = await req.json()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'noreply@yourapp.com',
      to,
      subject,
      html
    })
  })

  const data = await response.json()

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

### OpenAI Integration
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const { prompt } = await req.json()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    })
  })

  const data = await response.json()

  return new Response(
    JSON.stringify({
      response: data.choices[0].message.content
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

## Scheduled Tasks (pg_cron)

### Setup pg_cron
```sql
-- Enable extension
create extension if not exists pg_cron;

-- Grant access
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
```

### Schedule Function Calls
```sql
-- Call Edge Function daily at midnight
select cron.schedule(
  'daily-cleanup',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/cleanup',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- List scheduled jobs
select * from cron.job;

-- Remove job
select cron.unschedule('daily-cleanup');
```

## Local Development

### Start Functions Locally
```bash
# Start all functions
supabase functions serve

# Start specific function
supabase functions serve hello-world

# With environment variables
supabase functions serve --env-file .env.local
```

### Testing Locally
```bash
# cURL
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name": "World"}'

# Using Supabase client
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'World' }
})
```

## Deployment

### Deploy Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy hello-world

# Deploy with environment variables
supabase secrets set RESEND_API_KEY=re_xxx

# List secrets
supabase secrets list
```

### Environment Variables
```bash
# Set secrets
supabase secrets set API_KEY=xxx SECRET_KEY=yyy

# Unset secrets
supabase secrets unset API_KEY

# Available by default:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_DB_URL
```

## Best Practices

### Error Handling
```typescript
serve(async (req) => {
  try {
    // Your logic
  } catch (error) {
    console.error('Function error:', error)

    // Don't expose internal errors
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production'

    return new Response(
      JSON.stringify({
        error: isProduction ? 'Internal server error' : error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### Logging
```typescript
// Logs are visible in Supabase Dashboard
console.log('Processing request:', req.url)
console.info('User action:', { userId, action })
console.warn('Deprecated API used')
console.error('Failed to process:', error)
```

### Response Helpers
```typescript
// supabase/functions/_shared/response.ts
import { corsHeaders } from './cors.ts'

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

export function error(message: string, status = 400) {
  return json({ error: message }, status)
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401)
}

export function notFound(message = 'Not found') {
  return error(message, 404)
}
```

### Rate Limiting
```typescript
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimits.get(ip)

  if (!record || record.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  // Continue with request
})
```
