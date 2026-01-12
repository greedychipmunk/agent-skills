# MedusaJS Development Templates

Comprehensive code templates based on official MedusaJS v2 documentation and best practices.

## Overview

This collection provides production-ready templates for common MedusaJS development patterns. Each template includes:
- Complete, working code examples
- Inline documentation and comments
- Usage instructions
- Best practices and patterns
- Common variations and extensions

## Templates Available

### 1. module-complete.ts
**Complete Custom Module Structure**

Includes:
- Multiple data models with various property types
- One-to-many and many-to-many relationships
- Main service extending MedusaService
- Additional custom services
- Module configuration and exports
- Usage examples

**Use when:** Creating a new custom module with data models and business logic

```typescript
// Example: Blog Module, Brand Module, Restaurant Module, etc.
```

### 2. api-route-complete.ts
**Complete REST API Route**

Includes:
- GET, POST, PUT, DELETE handlers
- Zod validation schemas
- Middleware configuration (authentication & validation)
- Error handling patterns
- Query integration for related data
- Pagination and filtering

**Use when:** Creating API endpoints to expose module functionality

```typescript
// Example: /api/brands, /api/restaurants, /api/reviews
```

### 3. workflow-complete.ts
**Complete Workflow with Steps**

Includes:
- Multiple workflow steps
- Input/output typing
- Compensation functions for rollback
- Data transformation between steps
- Conditional execution with when()
- Integration with Medusa modules
- Error handling

**Use when:** Implementing complex business logic with multiple steps and rollback requirements

```typescript
// Example: Order processing, Entity synchronization, Report generation
```

### 4. subscriber-complete.ts
**Complete Event Subscriber**

Includes:
- Basic event handling
- Workflow execution in subscribers
- Service resolution patterns
- Multi-event subscribers
- Conditional logic
- Retry mechanisms
- Error handling

**Use when:** Responding to Medusa events (order.placed, product.created, etc.)

```typescript
// Example: Send emails, Sync to external systems, Update related data
```

### 5. module-link.ts
**Module Link Patterns**

Includes:
- Basic link between modules
- List links (one-to-many)
- Delete cascade configuration
- Custom columns in link tables
- Creating and dismissing links
- Querying linked data

**Use when:** Creating relationships between data models in different modules

```typescript
// Example: Product <-> Brand, Restaurant <-> Products, Order <-> DigitalProduct
```

### 6. scheduled-job.ts
**Scheduled Job Patterns**

Includes:
- Basic scheduled jobs
- Service resolution
- Batch processing
- Workflow execution
- External API integration
- Cleanup tasks
- Common cron patterns
- Error handling

**Use when:** Running recurring automated tasks

```typescript
// Example: Sync inventory, Generate reports, Cleanup old data
```

## Quick Start

### Using a Template

1. **Choose the appropriate template** for your use case
2. **Copy the template** to your project location
3. **Rename** files and identifiers to match your domain
4. **Customize** the logic for your specific requirements
5. **Test** thoroughly before deploying

### Example: Creating a Custom Module

```bash
# 1. Copy the template
cp templates/module-complete.ts src/modules/brand/

# 2. Rename and structure
src/modules/brand/
├── models/
│   ├── brand.ts
│   └── brand-ambassador.ts
├── services/
│   └── analytics.ts
├── service.ts
└── index.ts

# 3. Generate migrations
npx medusa db:generate brand

# 4. Run migrations
npx medusa db:migrate

# 5. Register in medusa-config.ts
modules: [
  {
    resolve: "./src/modules/brand"
  }
]
```

## Template Combinations

Templates are designed to work together. Common combinations:

### E-commerce Extension
1. **module-complete.ts** → Create Brand Module
2. **module-link.ts** → Link Brand to Product
3. **api-route-complete.ts** → Create Brand API endpoints
4. **workflow-complete.ts** → Process brand synchronization
5. **subscriber-complete.ts** → Handle brand.created event

### Data Synchronization
1. **workflow-complete.ts** → Sync workflow with steps
2. **scheduled-job.ts** → Run sync periodically
3. **subscriber-complete.ts** → Sync on specific events
4. **module-link.ts** → Link synced entities

### Custom Commerce Flow
1. **module-complete.ts** → Create custom entities
2. **workflow-complete.ts** → Implement business logic
3. **api-route-complete.ts** → Expose APIs
4. **module-link.ts** → Link to Cart/Order modules
5. **subscriber-complete.ts** → Handle order completion

## Best Practices

### Code Organization
```
src/
├── modules/           # Custom modules
│   └── [module-name]/
│       ├── models/    # Data models
│       ├── services/  # Additional services
│       ├── service.ts # Main service
│       └── index.ts   # Module definition
├── workflows/         # Business logic workflows
│   └── [workflow-name]/
│       ├── steps/     # Individual steps
│       └── index.ts   # Workflow composition
├── api/              # API routes
│   └── [route-name]/
│       ├── route.ts  # Route handlers
│       ├── [id]/
│       │   └── route.ts
│       └── validators.ts
├── subscribers/      # Event handlers
├── jobs/            # Scheduled tasks
└── links/           # Module links
```

### Naming Conventions

#### Modules
```typescript
// Module name (snake_case)
export const BRAND_MODULE = "brandModuleService"

// Data model (snake_case table name)
const Brand = model.define("brand", { ... })

// Service class (PascalCase)
class BrandModuleService extends MedusaService({ ... })
```

#### API Routes
```typescript
// Route path: /api/brands
// Location: src/api/brands/route.ts

// Single item: /api/brands/:id
// Location: src/api/brands/[id]/route.ts
```

#### Workflows
```typescript
// Workflow name (kebab-case)
export const syncBrandWorkflow = createWorkflow(
  "sync-brand",
  function (input) { ... }
)

// Step name (kebab-case)
export const validateBrandStep = createStep(
  "validate-brand",
  async (input) => { ... }
)
```

#### Subscribers
```typescript
// File name: kebab-case, describes event
// src/subscribers/brand-created.ts

// Event name: dot notation
export const config: SubscriberConfig = {
  event: "brand.created"
}
```

### Type Safety

Always use TypeScript types:
```typescript
// Input/Output types
export type WorkflowInput = {
  entityId: string
  data: Record<string, any>
}

export type WorkflowOutput = {
  success: boolean
  entity: any
}

// Zod schemas for validation
export const CreateEntitySchema = z.object({
  name: z.string().min(1),
  price: z.number().positive()
})

export type CreateEntityType = z.infer<typeof CreateEntitySchema>
```

### Error Handling

Always implement proper error handling:
```typescript
try {
  // Operation
  logger.info("Operation started", { context })

  const result = await operation()

  logger.info("Operation completed", { result })

  return result
} catch (error) {
  logger.error("Operation failed", {
    error: error.message,
    context
  })

  // Re-throw or handle gracefully
  throw error
}
```

## Troubleshooting

### Module Not Found
```bash
# Ensure module is registered in medusa-config.ts
modules: [
  {
    resolve: "./src/modules/[module-name]"
  }
]

# Restart server
npm run dev
```

### Link Not Synced
```bash
# Sync links after creating link definition
npx medusa db:sync-links

# Or run full migration
npx medusa db:migrate
```

### Validation Errors
```typescript
// Ensure middleware is applied
// src/api/middlewares.ts
export default defineMiddlewares({
  routes: [
    {
      matcher: "/your-route",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(YourSchema)
      ]
    }
  ]
})
```

### Service Resolution Fails
```typescript
// Check module name matches registration
export const MODULE_NAME = "moduleService"

// Resolve with correct name
const service = container.resolve(MODULE_NAME)
```

## Testing Templates

Each template can be tested individually:

```bash
# Test module
./scripts/create-module.sh test-module

# Test API route
./scripts/create-api-route.sh test-route
curl http://localhost:9000/api/test-route

# Test workflow (create test API route)
POST /api/test-workflow
{ "input": { ... } }

# Test subscriber (emit test event)
await eventBus.emit({ name: "test.event", data: { ... } })

# Test scheduled job (create test trigger)
GET /api/trigger-job
```

## Additional Resources

- [MedusaJS Documentation](https://docs.medusajs.com/)
- [Medusa CLI Reference](https://docs.medusajs.com/resources/medusa-cli)
- [Data Model Reference](https://docs.medusajs.com/resources/references/data-model)
- [Workflow SDK Reference](https://docs.medusajs.com/resources/references/workflows)
- [Medusa Examples](https://docs.medusajs.com/resources/examples)

## Contributing

These templates are based on official Medusa documentation and real-world patterns. Feel free to:
- Extend templates with additional patterns
- Submit improvements and corrections
- Share your custom variations
- Report issues or missing patterns

## License

MIT - Use freely in your MedusaJS projects.
