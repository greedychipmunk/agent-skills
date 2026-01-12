/**
 * Module Link Templates
 *
 * This template shows various module link patterns:
 * - Basic link between two modules
 * - List link (one-to-many)
 * - Link with delete cascade
 * - Link with custom columns
 * - Links to Commerce Modules
 * - How to create and dismiss links
 * - How to query linked data
 *
 * Usage: Copy and adapt these patterns for your module links
 * Location: src/links/[link-name].ts
 */

// ============================================================================
// BASIC MODULE LINK
// ============================================================================

// src/links/product-brand.ts
import ProductModule from "@medusajs/medusa/product"
import BrandModule from "../modules/brand"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Basic Link: Product to Brand
 * One-to-one relationship
 */
export default defineLink(
  ProductModule.linkable.product,
  BrandModule.linkable.brand
)

// ============================================================================
// LIST LINK (ONE-TO-MANY)
// ============================================================================

// src/links/restaurant-products.ts
import ProductModule from "@medusajs/medusa/product"
import RestaurantModule from "../modules/restaurant"
import { defineLink } from "@medusajs/framework/utils"

/**
 * List Link: Restaurant to Products
 * One restaurant has many products
 */
export default defineLink(
  RestaurantModule.linkable.restaurant,
  {
    linkable: ProductModule.linkable.product,
    isList: true
  }
)

// ============================================================================
// LINK WITH DELETE CASCADE
// ============================================================================

// src/links/digital-product-variant.ts
import ProductModule from "@medusajs/medusa/product"
import DigitalProductModule from "../modules/digital-product"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Link with Delete Cascade
 * When product variant is deleted, digital product is also deleted
 */
export default defineLink(
  {
    linkable: DigitalProductModule.linkable.digitalProduct,
    deleteCascade: true
  },
  ProductModule.linkable.productVariant
)

// ============================================================================
// LINK WITH CUSTOM COLUMNS
// ============================================================================

// src/links/product-blog-post.ts
import ProductModule from "@medusajs/medusa/product"
import BlogModule from "../modules/blog"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Link with Custom Columns
 * Adds extra data to the link table
 */
export default defineLink(
  ProductModule.linkable.product,
  BlogModule.linkable.post,
  {
    database: {
      extraColumns: {
        // Custom metadata column
        metadata: {
          type: "json"
        },
        // Order/priority column
        display_order: {
          type: "integer",
          defaultValue: 0
        },
        // Featured flag
        is_featured: {
          type: "boolean",
          defaultValue: false
        },
        // Custom timestamps
        linked_at: {
          type: "timestamptz",
          defaultValue: "now()"
        }
      }
    }
  }
)

// ============================================================================
// MULTIPLE LINKS FOR A MODULE
// ============================================================================

// src/links/entity-cart.ts
import CartModule from "@medusajs/medusa/cart"
import EntityModule from "../modules/entity"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Link: Entity to Cart
 */
export default defineLink(
  EntityModule.linkable.entity,
  CartModule.linkable.cart
)

// ----------------------------------------------------------------------------

// src/links/entity-order.ts
import OrderModule from "@medusajs/medusa/order"
import EntityModule from "../modules/entity"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Link: Entity to Order
 */
export default defineLink(
  EntityModule.linkable.entity,
  OrderModule.linkable.order
)

// ----------------------------------------------------------------------------

// src/links/entity-customer.ts
import CustomerModule from "@medusajs/medusa/customer"
import EntityModule from "../modules/entity"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Link: Entity to Customer (list link)
 * One customer can have many entities
 */
export default defineLink(
  CustomerModule.linkable.customer,
  {
    linkable: EntityModule.linkable.entity,
    isList: true
  }
)

// ============================================================================
// WORKING WITH LINKS - CREATING AND DISMISSING
// ============================================================================

/*
// In a workflow step or API route:

import { Modules } from "@medusajs/framework/utils"
import { ENTITY_MODULE } from "../modules/entity"

// Resolve Link service
const link = container.resolve("link")

// -------------------------------------------------------
// CREATE A LINK
// -------------------------------------------------------

// Basic link creation
await link.create({
  [Modules.PRODUCT]: {
    product_id: "prod_123"
  },
  [ENTITY_MODULE]: {
    entity_id: "entity_456"
  }
})

// Create link with custom column data
await link.create({
  [Modules.PRODUCT]: {
    product_id: "prod_123"
  },
  [ENTITY_MODULE]: {
    entity_id: "entity_456"
  },
  data: {
    metadata: {
      custom_field: "value"
    },
    display_order: 1,
    is_featured: true
  }
})

// Create multiple links at once
await link.create([
  {
    [Modules.PRODUCT]: {
      product_id: "prod_123"
    },
    [ENTITY_MODULE]: {
      entity_id: "entity_456"
    }
  },
  {
    [Modules.PRODUCT]: {
      product_id: "prod_123"
    },
    [ENTITY_MODULE]: {
      entity_id: "entity_789"
    }
  }
])

// -------------------------------------------------------
// DISMISS A LINK
// -------------------------------------------------------

// Dismiss single link
await link.dismiss({
  [Modules.PRODUCT]: {
    product_id: "prod_123"
  },
  [ENTITY_MODULE]: {
    entity_id: "entity_456"
  }
})

// Dismiss all links for a product
await link.dismiss({
  [Modules.PRODUCT]: {
    product_id: "prod_123"
  }
})

// -------------------------------------------------------
// UPDATE LINK DATA (custom columns)
// -------------------------------------------------------

await link.update({
  [Modules.PRODUCT]: {
    product_id: "prod_123"
  },
  [ENTITY_MODULE]: {
    entity_id: "entity_456"
  },
  data: {
    display_order: 5,
    is_featured: false
  }
})
*/

// ============================================================================
// QUERYING LINKED DATA
// ============================================================================

/*
// Using Query to retrieve linked data

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import productEntityLink from "../links/product-entity"

// Resolve Query
const query = container.resolve(ContainerRegistrationKeys.QUERY)

// -------------------------------------------------------
// QUERY LINKED DATA FROM PRODUCT SIDE
// -------------------------------------------------------

const { data: productsWithEntities } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "handle",
    "entity.*" // Get all entity fields
  ],
  filters: {
    id: "prod_123"
  }
})

// -------------------------------------------------------
// QUERY LINKED DATA FROM ENTITY SIDE
// -------------------------------------------------------

const { data: entitiesWithProducts } = await query.graph({
  entity: "entity",
  fields: [
    "id",
    "name",
    "description",
    "product.*" // Get all product fields
  ],
  filters: {
    id: "entity_456"
  }
})

// -------------------------------------------------------
// QUERY LINK TABLE DIRECTLY (with custom columns)
// -------------------------------------------------------

const { data: linkRecords } = await query.graph({
  entity: productEntityLink.entryPoint,
  fields: [
    "product_id",
    "entity_id",
    "metadata",
    "display_order",
    "is_featured",
    "linked_at",
    "product.*",
    "entity.*"
  ],
  filters: {
    product_id: "prod_123"
  }
})

// -------------------------------------------------------
// QUERY WITH NESTED RELATIONSHIPS
// -------------------------------------------------------

const { data: products } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    // Get linked entity
    "entity.id",
    "entity.name",
    // Get entity's related data
    "entity.related_entities.*",
    "entity.tags.*"
  ],
  filters: {
    id: "prod_123"
  }
})

// -------------------------------------------------------
// QUERY WITH FILTERING ON LINKED DATA
// -------------------------------------------------------

const { data: products } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "entity.*"
  ],
  filters: {
    entity: {
      is_active: true,
      status: "published"
    }
  }
})
*/

// ============================================================================
// COMPLETE EXAMPLE: WORKFLOW WITH LINKS
// ============================================================================

/*
// src/workflows/link-product-to-entity/index.ts

import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createLinkStep } from "./steps/create-link"
import { notifyLinkCreatedStep } from "./steps/notify-link-created"

export type LinkProductToEntityInput = {
  productId: string
  entityId: string
  metadata?: Record<string, any>
  displayOrder?: number
  isFeatured?: boolean
}

export const linkProductToEntityWorkflow = createWorkflow(
  "link-product-to-entity",
  function (input: LinkProductToEntityInput) {
    // Create the link
    const link = createLinkStep({
      productId: input.productId,
      entityId: input.entityId,
      metadata: input.metadata,
      displayOrder: input.displayOrder,
      isFeatured: input.isFeatured
    })

    // Notify about the link
    notifyLinkCreatedStep({
      productId: input.productId,
      entityId: input.entityId
    })

    return new WorkflowResponse(link)
  }
)

// src/workflows/link-product-to-entity/steps/create-link.ts

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ENTITY_MODULE } from "../../../modules/entity"

export const createLinkStep = createStep(
  "create-link",
  async (input, { container }) => {
    const link = container.resolve("link")
    const logger = container.resolve("logger")

    logger.info("Creating link between product and entity", {
      productId: input.productId,
      entityId: input.entityId
    })

    const linkData = await link.create({
      [Modules.PRODUCT]: {
        product_id: input.productId
      },
      [ENTITY_MODULE]: {
        entity_id: input.entityId
      },
      data: {
        metadata: input.metadata || {},
        display_order: input.displayOrder || 0,
        is_featured: input.isFeatured || false
      }
    })

    return new StepResponse(linkData, {
      productId: input.productId,
      entityId: input.entityId
    })
  },
  // Compensation: dismiss the link
  async (data, { container }) => {
    if (!data) return

    const link = container.resolve("link")
    const logger = container.resolve("logger")

    logger.warn("Rolling back link creation", data)

    await link.dismiss({
      [Modules.PRODUCT]: {
        product_id: data.productId
      },
      [ENTITY_MODULE]: {
        entity_id: data.entityId
      }
    })
  }
)
*/

// ============================================================================
// SYNCING LINKS
// ============================================================================

/*
After creating or modifying link definitions:

Terminal:
npx medusa db:migrate        # Runs migrations AND syncs links
npx medusa db:sync-links     # Only syncs links (faster)

Database Table Name:
- Automatic: product_blog_module_product_post
- Format: [module1]_[table1]_[module2]_[table2]

Link Table Columns:
- product_id
- post_id
- created_at
- updated_at
- [any custom columns defined]
*/
