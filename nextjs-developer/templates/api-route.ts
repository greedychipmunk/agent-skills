/**
 * API Route Handler Template
 *
 * This template demonstrates a complete API route with:
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Request validation with Zod
 * - Error handling
 * - Authentication checks
 * - CORS headers
 * - Pagination
 * - Caching options
 *
 * Usage:
 * 1. Copy to app/api/[route]/route.ts
 * 2. Replace ENTITY with your resource name
 * 3. Implement your data access logic
 *
 * Location: app/api/[route-name]/route.ts
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

// Validation schemas using Zod
const CreateEntitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const UpdateEntitySchema = CreateEntitySchema.partial()

const QueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

type CreateEntityInput = z.infer<typeof CreateEntitySchema>
type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>
type QueryParams = z.infer<typeof QueryParamsSchema>

interface Entity {
  id: string
  title: string
  description?: string
  status: "draft" | "published" | "archived"
  tags: string[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse and validate query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return QueryParamsSchema.parse(params)
}

/**
 * Create standardized API response
 */
function createResponse<T>(
  data: T,
  options: {
    status?: number
    headers?: Record<string, string>
  } = {}
) {
  const { status = 200, headers = {} } = options

  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  })
}

/**
 * Create error response
 */
function createErrorResponse(
  message: string,
  options: {
    status?: number
    code?: string
    details?: unknown
  } = {}
) {
  const { status = 500, code = "INTERNAL_ERROR", details } = options

  return NextResponse.json(
    {
      error: {
        message,
        code,
        ...(details && { details }),
      },
    },
    { status }
  )
}

/**
 * Check authentication (implement your auth logic)
 */
async function checkAuth(request: NextRequest): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)

  // TODO: Implement your token verification logic
  // Example: return await verifyToken(token)

  // Placeholder: return mock user
  return { userId: "user_123" }
}

// ============================================================================
// DATA ACCESS (Replace with your implementation)
// ============================================================================

// Simulated database operations - replace with your actual data access
async function findEntities(params: QueryParams): Promise<{ items: Entity[]; total: number }> {
  // TODO: Implement actual database query
  return { items: [], total: 0 }
}

async function findEntityById(id: string): Promise<Entity | null> {
  // TODO: Implement actual database query
  return null
}

async function createEntity(data: CreateEntityInput): Promise<Entity> {
  // TODO: Implement actual database insert
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    ...data,
    description: data.description ?? undefined,
    tags: data.tags ?? [],
    metadata: data.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  }
}

async function updateEntity(id: string, data: UpdateEntityInput): Promise<Entity | null> {
  // TODO: Implement actual database update
  return null
}

async function deleteEntity(id: string): Promise<boolean> {
  // TODO: Implement actual database delete
  return true
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

/**
 * GET /api/entities
 * List entities with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const params = parseQueryParams(request.nextUrl.searchParams)

    // Fetch data
    const { items, total } = await findEntities(params)

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / params.limit)
    const hasNextPage = params.page < totalPages
    const hasPrevPage = params.page > 1

    return createResponse({
      data: items,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    }, {
      headers: {
        // Cache for 60 seconds, allow stale for 300 seconds while revalidating
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse("Invalid query parameters", {
        status: 400,
        code: "VALIDATION_ERROR",
        details: error.errors,
      })
    }

    console.error("GET /api/entities error:", error)
    return createErrorResponse("Failed to fetch entities")
  }
}

/**
 * POST /api/entities
 * Create a new entity
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAuth(request)
    if (!auth) {
      return createErrorResponse("Unauthorized", {
        status: 401,
        code: "UNAUTHORIZED",
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const data = CreateEntitySchema.parse(body)

    // Create entity
    const entity = await createEntity(data)

    return createResponse(
      { data: entity },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse("Validation failed", {
        status: 400,
        code: "VALIDATION_ERROR",
        details: error.errors,
      })
    }

    if (error instanceof SyntaxError) {
      return createErrorResponse("Invalid JSON body", {
        status: 400,
        code: "INVALID_JSON",
      })
    }

    console.error("POST /api/entities error:", error)
    return createErrorResponse("Failed to create entity")
  }
}

// ============================================================================
// DYNAMIC ROUTE HANDLERS
// ============================================================================

// For app/api/entities/[id]/route.ts

/**
 * GET /api/entities/[id]
 * Get a single entity by ID
 */
export async function GET_BY_ID(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entity = await findEntityById(params.id)

    if (!entity) {
      return createErrorResponse("Entity not found", {
        status: 404,
        code: "NOT_FOUND",
      })
    }

    return createResponse({ data: entity })
  } catch (error) {
    console.error(`GET /api/entities/${params.id} error:`, error)
    return createErrorResponse("Failed to fetch entity")
  }
}

/**
 * PUT /api/entities/[id]
 * Update an entity (full replacement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const auth = await checkAuth(request)
    if (!auth) {
      return createErrorResponse("Unauthorized", {
        status: 401,
        code: "UNAUTHORIZED",
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const data = CreateEntitySchema.parse(body)

    // Update entity
    const entity = await updateEntity(params.id, data)

    if (!entity) {
      return createErrorResponse("Entity not found", {
        status: 404,
        code: "NOT_FOUND",
      })
    }

    return createResponse({ data: entity })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse("Validation failed", {
        status: 400,
        code: "VALIDATION_ERROR",
        details: error.errors,
      })
    }

    console.error(`PUT /api/entities/${params.id} error:`, error)
    return createErrorResponse("Failed to update entity")
  }
}

/**
 * PATCH /api/entities/[id]
 * Partially update an entity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const auth = await checkAuth(request)
    if (!auth) {
      return createErrorResponse("Unauthorized", {
        status: 401,
        code: "UNAUTHORIZED",
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const data = UpdateEntitySchema.parse(body)

    // Update entity
    const entity = await updateEntity(params.id, data)

    if (!entity) {
      return createErrorResponse("Entity not found", {
        status: 404,
        code: "NOT_FOUND",
      })
    }

    return createResponse({ data: entity })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse("Validation failed", {
        status: 400,
        code: "VALIDATION_ERROR",
        details: error.errors,
      })
    }

    console.error(`PATCH /api/entities/${params.id} error:`, error)
    return createErrorResponse("Failed to update entity")
  }
}

/**
 * DELETE /api/entities/[id]
 * Delete an entity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const auth = await checkAuth(request)
    if (!auth) {
      return createErrorResponse("Unauthorized", {
        status: 401,
        code: "UNAUTHORIZED",
      })
    }

    const deleted = await deleteEntity(params.id)

    if (!deleted) {
      return createErrorResponse("Entity not found", {
        status: 404,
        code: "NOT_FOUND",
      })
    }

    return createResponse({
      data: { id: params.id, deleted: true },
    })
  } catch (error) {
    console.error(`DELETE /api/entities/${params.id} error:`, error)
    return createErrorResponse("Failed to delete entity")
  }
}

// ============================================================================
// CORS HANDLER (for OPTIONS preflight requests)
// ============================================================================

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}

// ============================================================================
// ROUTE SEGMENT CONFIG
// ============================================================================

// Force dynamic rendering (no caching at route level)
// export const dynamic = 'force-dynamic'

// Set maximum request duration (in seconds)
// export const maxDuration = 30
