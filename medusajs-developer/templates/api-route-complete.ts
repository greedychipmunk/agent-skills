/**
 * Complete API Route Template
 *
 * This template shows a complete API route structure with:
 * - GET, POST, PUT, DELETE handlers
 * - Zod validation schemas
 * - Middleware configuration for authentication and validation
 * - Proper error handling
 * - Query integration for retrieving related data
 *
 * Usage: Copy and adapt this structure for your API routes
 * Location: src/api/[route-name]/
 */

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// src/api/[route-name]/validators.ts
import { z } from "zod"

/**
 * POST request validation schema
 */
export const CreateEntitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  handle: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
  is_active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
}).strict()

export type CreateEntityType = z.infer<typeof CreateEntitySchema>

/**
 * PUT request validation schema
 */
export const UpdateEntitySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
}).strict()

export type UpdateEntityType = z.infer<typeof UpdateEntitySchema>

/**
 * Query parameters validation schema
 */
export const ListEntityQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional()
})

export type ListEntityQueryType = z.infer<typeof ListEntityQuerySchema>

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

// src/api/[route-name]/route.ts
import {
  MedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys
} from "@medusajs/framework/utils"
import { MODULE_NAME } from "../../modules/[module-name]"
import ModuleService from "../../modules/[module-name]/service"
import {
  CreateEntityType,
  ListEntityQueryType
} from "./validators"

/**
 * GET /[route-name]
 * List entities with pagination and filters
 */
export const GET = async (
  req: MedusaRequest<ListEntityQueryType>,
  res: MedusaResponse
) => {
  try {
    const moduleService: ModuleService = req.scope.resolve(MODULE_NAME)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Build filters from query parameters
    const filters: any = {}

    if (req.validatedQuery.is_active !== undefined) {
      filters.is_active = req.validatedQuery.is_active
    }

    if (req.validatedQuery.search) {
      filters.name = {
        $ilike: `%${req.validatedQuery.search}%`
      }
    }

    // Get entities with service
    const [entities, count] = await moduleService.listAndCountMainEntities(
      filters,
      {
        take: req.validatedQuery.limit,
        skip: req.validatedQuery.offset,
        relations: ["tags", "related_entities"]
      }
    )

    res.json({
      entities,
      count,
      limit: req.validatedQuery.limit,
      offset: req.validatedQuery.offset
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to retrieve entities"
    })
  }
}

/**
 * POST /[route-name]
 * Create a new entity
 */
export const POST = async (
  req: MedusaRequest<CreateEntityType>,
  res: MedusaResponse
) => {
  try {
    const moduleService: ModuleService = req.scope.resolve(MODULE_NAME)
    const logger = req.scope.resolve("logger")

    logger.info("Creating new entity", { body: req.validatedBody })

    // Create the entity
    const entity = await moduleService.createMainEntities({
      name: req.validatedBody.name,
      handle: req.validatedBody.handle || req.validatedBody.name.toLowerCase().replace(/\s+/g, "-"),
      description: req.validatedBody.description,
      price: req.validatedBody.price,
      is_active: req.validatedBody.is_active,
      metadata: req.validatedBody.metadata || {}
    })

    // If tags are provided, link them
    if (req.validatedBody.tags && req.validatedBody.tags.length > 0) {
      // Handle tag linking logic here
      // This would typically involve using Link or creating tag associations
    }

    logger.info("Entity created successfully", { entityId: entity.id })

    res.status(201).json({
      entity
    })
  } catch (error) {
    const logger = req.scope.resolve("logger")
    logger.error("Failed to create entity", { error: error.message })

    res.status(500).json({
      error: error.message,
      message: "Failed to create entity"
    })
  }
}

// ============================================================================
// SINGLE ENTITY ROUTES
// ============================================================================

// src/api/[route-name]/[id]/route.ts
import {
  MedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys
} from "@medusajs/framework/utils"
import { MODULE_NAME } from "../../../modules/[module-name]"
import ModuleService from "../../../modules/[module-name]/service"
import { UpdateEntityType } from "../validators"

/**
 * GET /[route-name]/:id
 * Retrieve a single entity by ID
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const moduleService: ModuleService = req.scope.resolve(MODULE_NAME)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Use Query to retrieve with relations
    const { data: entities } = await query.graph({
      entity: "main_entity",
      fields: [
        "id",
        "name",
        "handle",
        "description",
        "price",
        "is_active",
        "status",
        "metadata",
        "created_at",
        "updated_at",
        "tags.*",
        "related_entities.*"
      ],
      filters: {
        id
      }
    })

    if (!entities || entities.length === 0) {
      return res.status(404).json({
        message: `Entity with ID ${id} not found`
      })
    }

    res.json({
      entity: entities[0]
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to retrieve entity"
    })
  }
}

/**
 * PUT /[route-name]/:id
 * Update an entity by ID
 */
export const PUT = async (
  req: MedusaRequest<UpdateEntityType>,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const moduleService: ModuleService = req.scope.resolve(MODULE_NAME)
    const logger = req.scope.resolve("logger")

    // Check if entity exists
    const existingEntity = await moduleService.retrieveMainEntity(id)

    if (!existingEntity) {
      return res.status(404).json({
        message: `Entity with ID ${id} not found`
      })
    }

    logger.info("Updating entity", { entityId: id, updates: req.validatedBody })

    // Update the entity
    const entity = await moduleService.updateMainEntities({
      id,
      ...req.validatedBody
    })

    logger.info("Entity updated successfully", { entityId: id })

    res.json({
      entity
    })
  } catch (error) {
    const logger = req.scope.resolve("logger")
    logger.error("Failed to update entity", { error: error.message })

    res.status(500).json({
      error: error.message,
      message: "Failed to update entity"
    })
  }
}

/**
 * DELETE /[route-name]/:id
 * Delete an entity by ID
 */
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const moduleService: ModuleService = req.scope.resolve(MODULE_NAME)
    const logger = req.scope.resolve("logger")

    // Check if entity exists
    const existingEntity = await moduleService.retrieveMainEntity(id)

    if (!existingEntity) {
      return res.status(404).json({
        message: `Entity with ID ${id} not found`
      })
    }

    logger.info("Deleting entity", { entityId: id })

    // Soft delete the entity
    await moduleService.softDeleteMainEntities(id)

    logger.info("Entity deleted successfully", { entityId: id })

    res.json({
      id,
      deleted: true,
      message: "Entity deleted successfully"
    })
  } catch (error) {
    const logger = req.scope.resolve("logger")
    logger.error("Failed to delete entity", { error: error.message })

    res.status(500).json({
      error: error.message,
      message: "Failed to delete entity"
    })
  }
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// src/api/middlewares.ts (add to existing file)
import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery
} from "@medusajs/framework/http"
import {
  CreateEntitySchema,
  UpdateEntitySchema,
  ListEntityQuerySchema
} from "./[route-name]/validators"

export default defineMiddlewares({
  routes: [
    // Public routes (no authentication required)
    {
      method: ["GET"],
      matcher: "/[route-name]",
      middlewares: [
        validateAndTransformQuery(ListEntityQuerySchema)
      ]
    },
    {
      method: ["GET"],
      matcher: "/[route-name]/:id",
      middlewares: []
    },

    // Protected routes (authentication required)
    {
      method: ["POST"],
      matcher: "/[route-name]",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"]),
        validateAndTransformBody(CreateEntitySchema)
      ]
    },
    {
      method: ["PUT"],
      matcher: "/[route-name]/:id",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"]),
        validateAndTransformBody(UpdateEntitySchema)
      ]
    },
    {
      method: ["DELETE"],
      matcher: "/[route-name]/:id",
      middlewares: [
        authenticate("user", ["session", "bearer", "api-key"])
      ]
    }
  ]
})

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Create entity
POST http://localhost:9000/[route-name]
Content-Type: application/json
x-medusa-access-token: {user-token}

{
  "name": "Test Entity",
  "description": "A test entity",
  "price": 99.99,
  "is_active": true,
  "metadata": {
    "custom_field": "value"
  }
}

// List entities with filters
GET http://localhost:9000/[route-name]?is_active=true&limit=10&offset=0&search=test

// Get single entity
GET http://localhost:9000/[route-name]/{entity-id}

// Update entity
PUT http://localhost:9000/[route-name]/{entity-id}
Content-Type: application/json
x-medusa-access-token: {user-token}

{
  "name": "Updated Name",
  "is_active": false
}

// Delete entity
DELETE http://localhost:9000/[route-name]/{entity-id}
x-medusa-access-token: {user-token}
*/
