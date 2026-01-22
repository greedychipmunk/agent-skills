#!/bin/bash

# Create API Route Script for Next.js App Router
# Creates a new API route handler with CRUD operations
# Usage: ./scripts/create-api-route.sh <route-name> [--dynamic]

set -e

if [ $# -eq 0 ]; then
    echo "Error: Route name required"
    echo "Usage: ./scripts/create-api-route.sh <route-name> [OPTIONS]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/create-api-route.sh posts"
    echo "  ./scripts/create-api-route.sh users --dynamic"
    exit 1
fi

ROUTE_NAME=$1
shift

CREATE_DYNAMIC=false

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --dynamic|-d)
            CREATE_DYNAMIC=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/create-api-route.sh <route-name> [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dynamic, -d    Also create [id]/route.ts for single item operations"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

ROUTE_DIR="app/api/$ROUTE_NAME"

# Check if route already exists
if [ -d "$ROUTE_DIR" ]; then
    echo "Error: API route '$ROUTE_NAME' already exists at $ROUTE_DIR"
    exit 1
fi

echo "Creating API route: $ROUTE_NAME"

# Create directory
mkdir -p "$ROUTE_DIR"

# Create route.ts with GET and POST handlers
cat > "$ROUTE_DIR/route.ts" << 'EOF'
import { NextResponse } from "next/server"

/**
 * GET /api/ROUTE_NAME
 * List all items
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"
    const offset = searchParams.get("offset") || "0"

    // TODO: Implement your data fetching logic
    // Example: const items = await db.items.findMany({ take: Number(limit), skip: Number(offset) })

    const items: unknown[] = []

    return NextResponse.json({
      items,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: items.length,
      },
    })
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ROUTE_NAME
 * Create a new item
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // TODO: Validate input
    // TODO: Implement your creation logic
    // Example: const item = await db.items.create({ data: body })

    const item = { id: "new-id", ...body, createdAt: new Date().toISOString() }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("POST error:", error)
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    )
  }
}
EOF

# Replace ROUTE_NAME placeholder
sed -i.bak "s/ROUTE_NAME/$ROUTE_NAME/g" "$ROUTE_DIR/route.ts" && rm "$ROUTE_DIR/route.ts.bak"

echo "Created: $ROUTE_DIR/route.ts"

# Create [id]/route.ts if dynamic flag is set
if [ "$CREATE_DYNAMIC" = true ]; then
    mkdir -p "$ROUTE_DIR/[id]"

    cat > "$ROUTE_DIR/[id]/route.ts" << 'EOF'
import { NextResponse } from "next/server"

type Params = {
  params: { id: string }
}

/**
 * GET /api/ROUTE_NAME/[id]
 * Get a single item by ID
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params

    // TODO: Implement your data fetching logic
    // Example: const item = await db.items.findUnique({ where: { id } })

    const item = null

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ROUTE_NAME/[id]
 * Update an item by ID
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params
    const body = await request.json()

    // TODO: Validate input
    // TODO: Implement your update logic
    // Example: const item = await db.items.update({ where: { id }, data: body })

    const item = { id, ...body, updatedAt: new Date().toISOString() }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ROUTE_NAME/[id]
 * Partially update an item by ID
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params
    const body = await request.json()

    // TODO: Validate input
    // TODO: Implement your partial update logic

    const item = { id, ...body, updatedAt: new Date().toISOString() }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ROUTE_NAME/[id]
 * Delete an item by ID
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params

    // TODO: Implement your deletion logic
    // Example: await db.items.delete({ where: { id } })

    return NextResponse.json({
      id,
      deleted: true,
      message: "Item deleted successfully",
    })
  } catch (error) {
    console.error("DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    )
  }
}
EOF

    # Replace ROUTE_NAME placeholder
    sed -i.bak "s/ROUTE_NAME/$ROUTE_NAME/g" "$ROUTE_DIR/[id]/route.ts" && rm "$ROUTE_DIR/[id]/route.ts.bak"

    echo "Created: $ROUTE_DIR/[id]/route.ts"
fi

echo ""
echo "API route '$ROUTE_NAME' created successfully!"
echo "Location: $ROUTE_DIR"
echo ""
echo "Available endpoints:"
echo "  GET    /api/$ROUTE_NAME"
echo "  POST   /api/$ROUTE_NAME"
if [ "$CREATE_DYNAMIC" = true ]; then
    echo "  GET    /api/$ROUTE_NAME/:id"
    echo "  PUT    /api/$ROUTE_NAME/:id"
    echo "  PATCH  /api/$ROUTE_NAME/:id"
    echo "  DELETE /api/$ROUTE_NAME/:id"
fi
echo ""
echo "Next steps:"
echo "1. Implement your data fetching/mutation logic"
echo "2. Add input validation (consider using Zod)"
echo "3. Test your endpoints"
