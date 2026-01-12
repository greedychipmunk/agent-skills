#!/bin/bash

# Create API Route Script for MedusaJS
# Creates a new API route with basic CRUD operations
# Usage: ./scripts/create-api-route.sh <route-name>

set -e

if [ $# -eq 0 ]; then
    echo "Error: Route name required"
    echo "Usage: ./scripts/create-api-route.sh <route-name>"
    echo "Example: ./scripts/create-api-route.sh posts"
    exit 1
fi

ROUTE_NAME=$1
ROUTE_DIR="src/api/$ROUTE_NAME"

# Check if route already exists
if [ -d "$ROUTE_DIR" ]; then
    echo "Error: API route '$ROUTE_NAME' already exists at $ROUTE_DIR"
    exit 1
fi

echo "Creating API route: $ROUTE_NAME"

# Create directory
mkdir -p "$ROUTE_DIR"

# Create route.ts with basic CRUD operations
cat > "$ROUTE_DIR/route.ts" << 'EOF'
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET handler - List all items
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // TODO: Implement your logic here
    // Example: const service = req.scope.resolve("yourService")
    // const items = await service.list()

    res.json({
      message: "GET request successful",
      // items
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

/**
 * POST handler - Create a new item
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // TODO: Implement your logic here
    // Example: const service = req.scope.resolve("yourService")
    // const item = await service.create(req.body)

    res.status(201).json({
      message: "POST request successful",
      // item
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}
EOF

# Create [id]/route.ts for single item operations
mkdir -p "$ROUTE_DIR/[id]"
cat > "$ROUTE_DIR/[id]/route.ts" << 'EOF'
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET handler - Get a single item by ID
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params

    // TODO: Implement your logic here
    // Example: const service = req.scope.resolve("yourService")
    // const item = await service.retrieve(id)

    res.json({
      message: `GET request for ID: ${id}`,
      // item
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

/**
 * PUT handler - Update an item by ID
 */
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params

    // TODO: Implement your logic here
    // Example: const service = req.scope.resolve("yourService")
    // const item = await service.update(id, req.body)

    res.json({
      message: `PUT request for ID: ${id}`,
      // item
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}

/**
 * DELETE handler - Delete an item by ID
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params

    // TODO: Implement your logic here
    // Example: const service = req.scope.resolve("yourService")
    // await service.delete(id)

    res.json({
      message: `DELETE request for ID: ${id}`,
      deleted: true
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}
EOF

echo ""
echo "API route '$ROUTE_NAME' created successfully!"
echo "Location: $ROUTE_DIR"
echo ""
echo "Available endpoints:"
echo "  GET    /api/$ROUTE_NAME"
echo "  POST   /api/$ROUTE_NAME"
echo "  GET    /api/$ROUTE_NAME/:id"
echo "  PUT    /api/$ROUTE_NAME/:id"
echo "  DELETE /api/$ROUTE_NAME/:id"
echo ""
echo "Next steps:"
echo "1. Implement your business logic in the route handlers"
echo "2. Resolve your service using req.scope.resolve()"
echo "3. Test your endpoints with a REST client"
