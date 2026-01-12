# MedusaJS API Development Patterns

## Custom API Routes

### Basic Route Structure
```typescript
// src/api/[route-name]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Handler implementation
  res.json({ data: "response" })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  // Handler implementation
  res.json({ created: "resource" })
}
```

### Request/Response Patterns

#### Accessing Services
```typescript
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productService = req.scope.resolve("productService")
  const products = await productService.listProducts()
  res.json({ products })
}
```

#### Query Parameters
```typescript
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { limit = 20, offset = 0, q } = req.query
  
  const productService = req.scope.resolve("productService")
  const products = await productService.listProducts({
    limit: Number(limit),
    offset: Number(offset),
    q: q as string
  })
  
  res.json({ products, count: products.length })
}
```

#### Request Body Validation
```typescript
import { z } from "zod"

const createProductSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive()
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const validatedData = createProductSchema.parse(req.body)
  
  const productService = req.scope.resolve("productService")
  const product = await productService.createProduct(validatedData)
  
  res.status(201).json({ product })
}
```

#### Error Handling
```typescript
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const productService = req.scope.resolve("productService")
    const product = await productService.retrieveProduct(id)
    
    if (!product) {
      return res.status(404).json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      })
    }
    
    res.json({ product })
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    })
  }
}
```

## Authentication Patterns

### Admin API Routes
```typescript
// src/api/admin/custom/route.ts
import { authenticated } from "@medusajs/framework/http"

export const GET = authenticated(async (req: MedusaRequest, res: MedusaResponse) => {
  // Only authenticated admin users can access
  const userId = req.auth.actor_id
  res.json({ message: `Hello admin ${userId}` })
})
```

### Store API Routes with Customer Auth
```typescript
// src/api/store/profile/route.ts
import { authenticatedCustomer } from "@medusajs/framework/http"

export const GET = authenticatedCustomer(async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth.actor_id
  const customerService = req.scope.resolve("customerService")
  const customer = await customerService.retrieveCustomer(customerId)
  
  res.json({ customer })
})
```

## Middleware Patterns

### Custom Middleware
```typescript
// src/api/middleware.ts
import { MiddlewareRoute } from "@medusajs/framework/http"

export const middlewares: MiddlewareRoute[] = [
  {
    matcher: "/custom/*",
    middlewares: [
      async (req, res, next) => {
        // Custom logic
        console.log(`Request to ${req.path}`)
        next()
      }
    ]
  }
]
```

### Rate Limiting
```typescript
import rateLimit from "express-rate-limit"

export const middlewares: MiddlewareRoute[] = [
  {
    matcher: "/api/*",
    middlewares: [
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP"
      })
    ]
  }
]
```

## Response Formatting

### Standard Success Response
```typescript
const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  message: message || "Operation completed successfully"
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const products = await productService.listProducts()
  res.json(successResponse(products, "Products retrieved"))
}
```

### Pagination Response
```typescript
const paginatedResponse = (data: any[], total: number, limit: number, offset: number) => ({
  data,
  pagination: {
    total,
    limit,
    offset,
    pages: Math.ceil(total / limit),
    current_page: Math.floor(offset / limit) + 1
  }
})
```

### Error Response
```typescript
const errorResponse = (message: string, code?: string, details?: any) => ({
  success: false,
  error: {
    message,
    code: code || "UNKNOWN_ERROR",
    details
  }
})
```

## Testing API Routes

### Unit Tests
```typescript
// __tests__/api/products/route.test.ts
import { GET } from "../../../src/api/products/route"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

describe("GET /products", () => {
  it("should return products list", async () => {
    const mockReq = {
      scope: {
        resolve: jest.fn().mockReturnValue({
          listProducts: jest.fn().mockResolvedValue([])
        })
      }
    } as unknown as MedusaRequest

    const mockRes = {
      json: jest.fn()
    } as unknown as MedusaResponse

    await GET(mockReq, mockRes)
    expect(mockRes.json).toHaveBeenCalledWith({ products: [] })
  })
})
```

### Integration Tests
```typescript
import request from "supertest"
import { app } from "../setup-test"

describe("Products API", () => {
  it("should create a product", async () => {
    const response = await request(app)
      .post("/api/products")
      .send({
        title: "Test Product",
        price: 100
      })
      .expect(201)

    expect(response.body.product).toBeDefined()
    expect(response.body.product.title).toBe("Test Product")
  })
})
```