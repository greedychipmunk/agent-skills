# Next.js API Routes (Route Handlers)

## Overview

Route Handlers allow you to create custom request handlers for a given route using the Web Request and Response APIs.

---

## Basic Structure

### File Convention
```
app/
└── api/
    ├── route.ts              # /api
    ├── posts/
    │   └── route.ts          # /api/posts
    └── posts/
        └── [id]/
            └── route.ts      # /api/posts/[id]
```

### HTTP Methods
```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {}
export async function POST(request: Request) {}
export async function PUT(request: Request) {}
export async function PATCH(request: Request) {}
export async function DELETE(request: Request) {}
export async function HEAD(request: Request) {}
export async function OPTIONS(request: Request) {}
```

---

## Request Handling

### Reading Request Body
```typescript
export async function POST(request: Request) {
  const body = await request.json()

  return Response.json({
    received: body,
  })
}
```

### Form Data
```typescript
export async function POST(request: Request) {
  const formData = await request.formData()
  const name = formData.get("name")
  const email = formData.get("email")

  return Response.json({ name, email })
}
```

### URL Search Params
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const page = searchParams.get("page") || "1"

  return Response.json({ query, page })
}
```

### Headers
```typescript
import { headers } from "next/headers"

export async function GET() {
  const headersList = headers()
  const authorization = headersList.get("authorization")

  return Response.json({ authorization })
}
```

### Cookies
```typescript
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get("token")

  return Response.json({ token: token?.value })
}

export async function POST() {
  const cookieStore = cookies()

  cookieStore.set("session", "abc123", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 day
  })

  return Response.json({ success: true })
}
```

---

## Response Handling

### JSON Response
```typescript
export async function GET() {
  return Response.json({ message: "Hello" })
}

// With status code
export async function POST() {
  return Response.json(
    { message: "Created" },
    { status: 201 }
  )
}
```

### Using NextResponse
```typescript
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { message: "Hello" },
    {
      status: 200,
      headers: {
        "Cache-Control": "max-age=3600",
      },
    }
  )
}
```

### Redirects
```typescript
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

export async function GET() {
  // Option 1: Using redirect function
  redirect("/new-location")

  // Option 2: Using NextResponse
  return NextResponse.redirect(new URL("/new-location", request.url))
}
```

### Streaming Response
```typescript
export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`))
        await new Promise((r) => setTimeout(r, 100))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

---

## Dynamic Routes

### Single Parameter
```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await getPost(params.id)

  if (!post) {
    return Response.json(
      { error: "Not found" },
      { status: 404 }
    )
  }

  return Response.json(post)
}
```

### Multiple Parameters
```typescript
// app/api/users/[userId]/posts/[postId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { userId: string; postId: string } }
) {
  const { userId, postId } = params
  const post = await getUserPost(userId, postId)

  return Response.json(post)
}
```

### Catch-All Routes
```typescript
// app/api/[...slug]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  // /api/a/b/c -> slug = ['a', 'b', 'c']
  const path = params.slug.join("/")

  return Response.json({ path })
}
```

---

## CORS

```typescript
// app/api/route.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders })
}

export async function GET() {
  return Response.json(
    { message: "Hello" },
    { headers: corsHeaders }
  )
}
```

---

## Caching

### Static Route Handler
```typescript
// Cached by default when using GET with no dynamic features
export async function GET() {
  const data = await fetch("https://api.example.com/data")
  return Response.json(data)
}
```

### Opt Out of Caching
```typescript
// Option 1: Use Request object
export async function GET(request: Request) {
  // Using request opts out of caching
  return Response.json({ time: Date.now() })
}

// Option 2: Route segment config
export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({ time: Date.now() })
}
```

### Revalidation
```typescript
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const data = await fetch("https://api.example.com/data")
  return Response.json(data)
}
```

---

## Error Handling

### Basic Error Handling
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await getPost(params.id)

    if (!post) {
      return Response.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return Response.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Validation Error
```typescript
import { z } from "zod"

const postSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = postSchema.parse(body)

    const post = await createPost(data)
    return Response.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

---

## Authentication

### Protected Route
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  return Response.json({ user: session.user })
}
```

### API Key Authentication
```typescript
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key")

  if (apiKey !== process.env.API_KEY) {
    return Response.json(
      { error: "Invalid API key" },
      { status: 401 }
    )
  }

  return Response.json({ data: "protected data" })
}
```

---

## File Uploads

```typescript
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return Response.json(
      { error: "No file provided" },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Save to filesystem or cloud storage
  const path = `/uploads/${file.name}`
  await writeFile(path, buffer)

  return Response.json({ path })
}
```

---

## Webhooks

```typescript
import crypto from "crypto"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("x-webhook-signature")

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest("hex")

  if (signature !== expectedSignature) {
    return Response.json(
      { error: "Invalid signature" },
      { status: 401 }
    )
  }

  const event = JSON.parse(body)

  // Process webhook event
  await processWebhookEvent(event)

  return Response.json({ received: true })
}
```

---

## Best Practices

### Structure
- Group related endpoints in folders
- Use descriptive route names
- Keep handlers focused and simple

### Security
- Validate all inputs
- Use proper authentication
- Sanitize responses (don't leak sensitive data)
- Implement rate limiting

### Performance
- Use appropriate caching
- Optimize database queries
- Return early on errors

### Error Handling
- Return appropriate status codes
- Provide helpful error messages
- Log errors for debugging

---

**Last Updated**: January 2026
