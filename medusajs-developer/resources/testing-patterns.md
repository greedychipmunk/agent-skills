# MedusaJS Testing Patterns

## Testing Setup

### Test Configuration
```typescript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/test/**/*.test.ts"
  ],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1"
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"]
}
```

### Test Setup File
```typescript
// test/setup.ts
import { MockContainer } from "@test/mocks/container"
import { MockDatabase } from "@test/mocks/database"

// Global test setup
beforeAll(async () => {
  // Setup test database
  await MockDatabase.setup()
})

afterAll(async () => {
  // Cleanup test database
  await MockDatabase.cleanup()
})

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks()
})

// Mock external services
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }))
}))

// Mock container resolution
jest.mock("@medusajs/framework/utils", () => ({
  ...jest.requireActual("@medusajs/framework/utils"),
  MedusaService: jest.fn().mockImplementation(() => MockContainer)
}))
```

## Unit Testing

### Service Testing
```typescript
// __tests__/services/product.test.ts
import ProductService from "@/modules/product/services/product"
import { MockRepository } from "@test/mocks/repository"

describe("ProductService", () => {
  let productService: ProductService
  let mockProductRepository: MockRepository
  let mockVariantRepository: MockRepository
  
  beforeEach(() => {
    mockProductRepository = new MockRepository()
    mockVariantRepository = new MockRepository()
    
    productService = new ProductService({
      productRepository: mockProductRepository,
      variantRepository: mockVariantRepository
    })
  })
  
  describe("createProduct", () => {
    it("should create a product with valid data", async () => {
      const productData = {
        title: "Test Product",
        description: "Test description",
        handle: "test-product",
        status: "published"
      }
      
      const expectedProduct = {
        id: "prod_1",
        ...productData,
        created_at: new Date(),
        updated_at: new Date()
      }
      
      mockProductRepository.create.mockResolvedValue(expectedProduct)
      mockProductRepository.save.mockResolvedValue(expectedProduct)
      
      const result = await productService.createProduct(productData)
      
      expect(mockProductRepository.create).toHaveBeenCalledWith(productData)
      expect(mockProductRepository.save).toHaveBeenCalledWith(expectedProduct)
      expect(result).toEqual(expectedProduct)
    })
    
    it("should throw error for duplicate handle", async () => {
      const productData = {
        title: "Test Product",
        handle: "existing-handle"
      }
      
      mockProductRepository.findOne.mockResolvedValue({ id: "existing_prod" })
      
      await expect(productService.createProduct(productData))
        .rejects
        .toThrow("Product with handle 'existing-handle' already exists")
    })
    
    it("should validate required fields", async () => {
      const invalidData = { description: "Missing title" }
      
      await expect(productService.createProduct(invalidData as any))
        .rejects
        .toThrow("Title is required")
    })
  })
  
  describe("updateProduct", () => {
    it("should update existing product", async () => {
      const productId = "prod_1"
      const updateData = { title: "Updated Title" }
      
      const existingProduct = {
        id: productId,
        title: "Original Title",
        handle: "test-product"
      }
      
      const updatedProduct = { ...existingProduct, ...updateData }
      
      mockProductRepository.findOne.mockResolvedValue(existingProduct)
      mockProductRepository.save.mockResolvedValue(updatedProduct)
      
      const result = await productService.updateProduct(productId, updateData)
      
      expect(result.title).toBe("Updated Title")
      expect(mockProductRepository.save).toHaveBeenCalledWith(updatedProduct)
    })
    
    it("should throw error for non-existent product", async () => {
      const productId = "non_existent"
      
      mockProductRepository.findOne.mockResolvedValue(null)
      
      await expect(productService.updateProduct(productId, {}))
        .rejects
        .toThrow("Product not found")
    })
  })
  
  describe("searchProducts", () => {
    it("should search products by title", async () => {
      const searchTerm = "test"
      const mockProducts = [
        { id: "prod_1", title: "Test Product 1" },
        { id: "prod_2", title: "Test Product 2" }
      ]
      
      mockProductRepository.findAndCount.mockResolvedValue([mockProducts, 2])
      
      const result = await productService.searchProducts(searchTerm)
      
      expect(result.products).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(mockProductRepository.findAndCount).toHaveBeenCalledWith({
        where: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } }
        ],
        take: 20,
        skip: 0
      })
    })
  })
})
```

### API Route Testing
```typescript
// __tests__/api/products/route.test.ts
import { GET, POST } from "@/api/products/route"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

describe("Products API", () => {
  let mockReq: Partial<MedusaRequest>
  let mockRes: Partial<MedusaResponse>
  let mockProductService: any
  
  beforeEach(() => {
    mockProductService = {
      listProducts: jest.fn(),
      createProduct: jest.fn(),
      retrieveProduct: jest.fn()
    }
    
    mockReq = {
      scope: {
        resolve: jest.fn().mockReturnValue(mockProductService)
      },
      query: {},
      body: {},
      params: {}
    }
    
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    }
  })
  
  describe("GET /products", () => {
    it("should return products list", async () => {
      const mockProducts = [
        { id: "prod_1", title: "Product 1" },
        { id: "prod_2", title: "Product 2" }
      ]
      
      mockProductService.listProducts.mockResolvedValue(mockProducts)
      
      await GET(mockReq as MedusaRequest, mockRes as MedusaResponse)
      
      expect(mockRes.json).toHaveBeenCalledWith({
        products: mockProducts
      })
    })
    
    it("should handle query parameters", async () => {
      mockReq.query = { limit: "10", offset: "5", q: "test" }
      mockProductService.listProducts.mockResolvedValue([])
      
      await GET(mockReq as MedusaRequest, mockRes as MedusaResponse)
      
      expect(mockProductService.listProducts).toHaveBeenCalledWith({
        limit: 10,
        offset: 5,
        q: "test"
      })
    })
    
    it("should handle service errors", async () => {
      mockProductService.listProducts.mockRejectedValue(new Error("Database error"))
      
      await GET(mockReq as MedusaRequest, mockRes as MedusaResponse)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
        message: "Database error"
      })
    })
  })
  
  describe("POST /products", () => {
    it("should create a new product", async () => {
      const productData = {
        title: "New Product",
        description: "Product description",
        handle: "new-product"
      }
      
      const createdProduct = { id: "prod_new", ...productData }
      
      mockReq.body = productData
      mockProductService.createProduct.mockResolvedValue(createdProduct)
      
      await POST(mockReq as MedusaRequest, mockRes as MedusaResponse)
      
      expect(mockProductService.createProduct).toHaveBeenCalledWith(productData)
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        product: createdProduct
      })
    })
    
    it("should validate request body", async () => {
      mockReq.body = { description: "Missing title" }
      
      await POST(mockReq as MedusaRequest, mockRes as MedusaResponse)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Validation error",
        details: expect.any(Array)
      })
    })
  })
})
```

## Integration Testing

### Database Integration Tests
```typescript
// __tests__/integration/product.test.ts
import { initializeTestDatabase, cleanupTestDatabase } from "@test/helpers/database"
import { createTestApplication } from "@test/helpers/application"
import { ProductService } from "@/modules/product/services/product"

describe("Product Integration Tests", () => {
  let app: any
  let productService: ProductService
  
  beforeAll(async () => {
    await initializeTestDatabase()
    app = await createTestApplication()
    productService = app.container.resolve("productService")
  })
  
  afterAll(async () => {
    await cleanupTestDatabase()
  })
  
  beforeEach(async () => {
    await app.database.query("TRUNCATE TABLE product CASCADE")
  })
  
  it("should create and retrieve product with variants", async () => {
    // Create product
    const product = await productService.createProduct({
      title: "Integration Test Product",
      description: "Test product for integration testing",
      handle: "integration-test-product"
    })
    
    expect(product.id).toBeDefined()
    expect(product.title).toBe("Integration Test Product")
    
    // Create variants
    const variant1 = await productService.createProductVariant(product.id, {
      title: "Small",
      sku: "INT-TEST-SM",
      prices: [{ currency_code: "usd", amount: 2000 }]
    })
    
    const variant2 = await productService.createProductVariant(product.id, {
      title: "Large",
      sku: "INT-TEST-LG", 
      prices: [{ currency_code: "usd", amount: 2500 }]
    })
    
    // Retrieve product with variants
    const retrievedProduct = await productService.retrieveProduct(product.id, {
      relations: ["variants", "variants.prices"]
    })
    
    expect(retrievedProduct.variants).toHaveLength(2)
    expect(retrievedProduct.variants[0].sku).toMatch(/INT-TEST-(SM|LG)/)
    expect(retrievedProduct.variants[0].prices).toHaveLength(1)
  })
  
  it("should handle product search correctly", async () => {
    // Create test products
    await Promise.all([
      productService.createProduct({
        title: "Red Shirt",
        description: "A red cotton shirt",
        handle: "red-shirt"
      }),
      productService.createProduct({
        title: "Blue Shirt", 
        description: "A blue cotton shirt",
        handle: "blue-shirt"
      }),
      productService.createProduct({
        title: "Red Pants",
        description: "Red cotton pants",
        handle: "red-pants"
      })
    ])
    
    // Search for "red" products
    const redProducts = await productService.searchProducts("red")
    expect(redProducts.products).toHaveLength(2)
    
    // Search for "shirt" products
    const shirtProducts = await productService.searchProducts("shirt")
    expect(shirtProducts.products).toHaveLength(2)
    
    // Search for "blue" products
    const blueProducts = await productService.searchProducts("blue")
    expect(blueProducts.products).toHaveLength(1)
  })
})
```

### API Integration Tests
```typescript
// __tests__/integration/api/products.test.ts
import request from "supertest"
import { createTestApplication } from "@test/helpers/application"

describe("Products API Integration", () => {
  let app: any
  
  beforeAll(async () => {
    app = await createTestApplication()
  })
  
  beforeEach(async () => {
    await app.database.query("TRUNCATE TABLE product CASCADE")
  })
  
  describe("Product CRUD Operations", () => {
    it("should complete full product lifecycle", async () => {
      // Create product
      const createResponse = await request(app)
        .post("/api/products")
        .send({
          title: "API Test Product",
          description: "Product created via API test",
          handle: "api-test-product"
        })
        .expect(201)
      
      const productId = createResponse.body.product.id
      expect(productId).toBeDefined()
      
      // Retrieve product
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200)
      
      expect(getResponse.body.product.title).toBe("API Test Product")
      
      // Update product
      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .send({
          title: "Updated API Test Product",
          status: "published"
        })
        .expect(200)
      
      expect(updateResponse.body.product.title).toBe("Updated API Test Product")
      expect(updateResponse.body.product.status).toBe("published")
      
      // List products
      const listResponse = await request(app)
        .get("/api/products")
        .expect(200)
      
      expect(listResponse.body.products).toHaveLength(1)
      expect(listResponse.body.products[0].id).toBe(productId)
      
      // Delete product
      await request(app)
        .delete(`/api/products/${productId}`)
        .expect(204)
      
      // Verify deletion
      await request(app)
        .get(`/api/products/${productId}`)
        .expect(404)
    })
    
    it("should handle validation errors", async () => {
      const response = await request(app)
        .post("/api/products")
        .send({
          description: "Product without title"
        })
        .expect(400)
      
      expect(response.body.error).toContain("validation")
    })
    
    it("should search products correctly", async () => {
      // Create test products
      await Promise.all([
        request(app)
          .post("/api/products")
          .send({
            title: "Red T-Shirt",
            handle: "red-tshirt"
          }),
        request(app)
          .post("/api/products")
          .send({
            title: "Blue T-Shirt", 
            handle: "blue-tshirt"
          })
      ])
      
      // Search for T-Shirt
      const searchResponse = await request(app)
        .get("/api/products?q=T-Shirt")
        .expect(200)
      
      expect(searchResponse.body.products).toHaveLength(2)
    })
  })
})
```

## Mock Utilities

### Repository Mocks
```typescript
// test/mocks/repository.ts
export class MockRepository {
  find = jest.fn()
  findOne = jest.fn() 
  findAndCount = jest.fn()
  create = jest.fn()
  save = jest.fn()
  update = jest.fn()
  delete = jest.fn()
  remove = jest.fn()
  count = jest.fn()
  
  reset() {
    Object.values(this).forEach(mock => {
      if (typeof mock === 'function' && 'mockClear' in mock) {
        mock.mockClear()
      }
    })
  }
}
```

### Service Mocks
```typescript
// test/mocks/services.ts
export const createMockProductService = () => ({
  listProducts: jest.fn(),
  retrieveProduct: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  searchProducts: jest.fn(),
  createProductVariant: jest.fn(),
  updateProductVariant: jest.fn(),
  deleteProductVariant: jest.fn()
})

export const createMockOrderService = () => ({
  listOrders: jest.fn(),
  retrieveOrder: jest.fn(),
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  cancelOrder: jest.fn(),
  createFulfillment: jest.fn(),
  createPayment: jest.fn()
})

export const createMockCustomerService = () => ({
  listCustomers: jest.fn(),
  retrieveCustomer: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  deleteCustomer: jest.fn(),
  addCustomerToGroup: jest.fn(),
  removeCustomerFromGroup: jest.fn()
})
```

### Test Helpers
```typescript
// test/helpers/database.ts
import { DataSource } from "typeorm"

let testDataSource: DataSource

export async function initializeTestDatabase() {
  testDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    entities: ["src/**/*.entity.ts"],
    synchronize: true,
    logging: false
  })
  
  await testDataSource.initialize()
  return testDataSource
}

export async function cleanupTestDatabase() {
  if (testDataSource?.isInitialized) {
    await testDataSource.destroy()
  }
}

export function getTestDataSource() {
  return testDataSource
}
```

```typescript
// test/helpers/application.ts
import { createMedusaApp } from "@medusajs/framework"

export async function createTestApplication() {
  const app = await createMedusaApp({
    database: {
      type: "sqlite",
      database: ":memory:",
      synchronize: true
    },
    redis: {
      host: "localhost",
      port: 6379,
      db: 1 // Use different DB for tests
    }
  })
  
  await app.initialize()
  return app
}
```

## Performance Testing

### Load Testing
```typescript
// __tests__/performance/products.test.ts
describe("Product Performance Tests", () => {
  let app: any
  let productService: any
  
  beforeAll(async () => {
    app = await createTestApplication()
    productService = app.container.resolve("productService")
  })
  
  it("should handle bulk product creation efficiently", async () => {
    const startTime = Date.now()
    
    const promises = Array.from({ length: 100 }, (_, index) => 
      productService.createProduct({
        title: `Performance Test Product ${index}`,
        handle: `performance-test-${index}`,
        description: "Bulk created product for performance testing"
      })
    )
    
    await Promise.all(promises)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`Created 100 products in ${duration}ms`)
    expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
  })
  
  it("should search large product catalog efficiently", async () => {
    // Create large dataset
    await Promise.all(
      Array.from({ length: 1000 }, (_, index) =>
        productService.createProduct({
          title: `Product ${index}`,
          handle: `product-${index}`,
          description: `Description for product ${index}`
        })
      )
    )
    
    const startTime = Date.now()
    
    const results = await productService.searchProducts("Product", {
      limit: 50,
      offset: 0
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`Searched 1000 products in ${duration}ms`)
    expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    expect(results.products).toHaveLength(50)
  })
})
```

### Memory Testing
```typescript
// __tests__/performance/memory.test.ts
describe("Memory Usage Tests", () => {
  it("should not have memory leaks in product operations", async () => {
    const getMemoryUsage = () => process.memoryUsage().heapUsed
    
    const initialMemory = getMemoryUsage()
    
    // Perform many operations
    for (let i = 0; i < 1000; i++) {
      await productService.createProduct({
        title: `Memory Test Product ${i}`,
        handle: `memory-test-${i}`
      })
      
      await productService.deleteProduct(`memory-test-${i}`)
    }
    
    // Force garbage collection
    if (global.gc) global.gc()
    
    const finalMemory = getMemoryUsage()
    const memoryIncrease = finalMemory - initialMemory
    
    console.log(`Memory increase: ${memoryIncrease / 1024 / 1024} MB`)
    
    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50 MB
  })
})
```