/**
 * Complete Subscriber Template
 *
 * This template shows various subscriber patterns:
 * - Basic event handling
 * - Executing workflows in subscribers
 * - Resolving services and modules
 * - Handling multiple events
 * - Error handling and logging
 * - Conditional logic
 *
 * Usage: Copy and adapt this structure for your subscribers
 * Location: src/subscribers/[subscriber-name].ts
 */

// ============================================================================
// BASIC SUBSCRIBER
// ============================================================================

// src/subscribers/entity-created.ts
import {
  type SubscriberArgs,
  type SubscriberConfig
} from "@medusajs/framework"

/**
 * Basic Subscriber: Handle entity creation
 * Listens to a single event and performs simple actions
 */
export default async function entityCreatedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const entityId = event.data.id

  logger.info(`Entity created: ${entityId}`)

  // Perform simple action
  // e.g., send notification, log to analytics, etc.
}

export const config: SubscriberConfig = {
  event: "entity.created"
}

// ============================================================================
// SUBSCRIBER WITH WORKFLOW EXECUTION
// ============================================================================

// src/subscribers/entity-updated.ts
import {
  type SubscriberArgs,
  type SubscriberConfig
} from "@medusajs/framework"
import { processEntityWorkflow } from "../workflows/process-entity"

/**
 * Subscriber with Workflow: Handle entity updates
 * Executes a workflow when an entity is updated
 */
export default async function entityUpdatedHandler({
  event: { data },
  container
}: SubscriberArgs<{ id: string; updates: Record<string, any> }>) {
  const logger = container.resolve("logger")

  logger.info("Processing entity update", {
    entityId: data.id,
    updates: data.updates
  })

  try {
    const { result } = await processEntityWorkflow(container).run({
      input: {
        entityId: data.id,
        data: data.updates,
        notifyExternal: true
      }
    })

    logger.info("Entity update processed successfully", {
      entityId: data.id,
      result
    })
  } catch (error) {
    logger.error("Failed to process entity update", {
      entityId: data.id,
      error: error.message
    })
    // Optionally: implement retry logic or error notification
  }
}

export const config: SubscriberConfig = {
  event: "entity.updated"
}

// ============================================================================
// SUBSCRIBER WITH SERVICE RESOLUTION
// ============================================================================

// src/subscribers/entity-published.ts
import {
  type SubscriberArgs,
  type SubscriberConfig
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { MODULE_NAME } from "../modules/[module-name]"
import ModuleService from "../modules/[module-name]/service"

/**
 * Subscriber with Service Resolution
 * Resolves custom module and Medusa modules
 */
export default async function entityPublishedHandler({
  event: { data },
  container
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  // Resolve custom module service
  const moduleService: ModuleService = container.resolve(MODULE_NAME)

  // Resolve Medusa modules
  const notificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )
  const eventBusModuleService = container.resolve(
    Modules.EVENT_BUS
  )

  try {
    // Fetch entity details
    const entity = await moduleService.retrieveMainEntity(data.id)

    logger.info("Entity published", {
      entityId: entity.id,
      name: entity.name
    })

    // Send notification
    await notificationModuleService.createNotifications({
      to: "admin@example.com",
      channel: "email",
      template: "entity-published",
      data: {
        entityName: entity.name,
        entityId: entity.id,
        publishedAt: new Date().toISOString()
      }
    })

    // Emit custom event
    await eventBusModuleService.emit({
      name: "entity.post_published",
      data: {
        entityId: entity.id,
        publishedAt: new Date()
      }
    })

    logger.info("Entity publication handled successfully", {
      entityId: entity.id
    })
  } catch (error) {
    logger.error("Failed to handle entity publication", {
      entityId: data.id,
      error: error.message
    })
  }
}

export const config: SubscriberConfig = {
  event: "entity.published"
}

// ============================================================================
// MULTI-EVENT SUBSCRIBER
// ============================================================================

// src/subscribers/entity-lifecycle.ts
import {
  type SubscriberArgs,
  type SubscriberConfig
} from "@medusajs/framework"
import { MODULE_NAME } from "../modules/[module-name]"
import ModuleService from "../modules/[module-name]/service"

/**
 * Multi-Event Subscriber: Handle multiple related events
 * Listens to multiple events and performs different actions
 */
export default async function entityLifecycleHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const moduleService: ModuleService = container.resolve(MODULE_NAME)

  const eventName = event.name
  const entityId = event.data.id

  logger.info("Entity lifecycle event triggered", {
    event: eventName,
    entityId
  })

  try {
    const entity = await moduleService.retrieveMainEntity(entityId)

    // Perform different actions based on event type
    switch (eventName) {
      case "entity.created":
        // Handle creation
        logger.info("Initializing new entity", { entityId })
        await moduleService.updateMainEntities({
          id: entityId,
          metadata: {
            ...entity.metadata,
            created_by_event: true,
            initialized_at: new Date().toISOString()
          }
        })
        break

      case "entity.updated":
        // Handle update
        logger.info("Entity updated", { entityId })
        // Perform update-specific logic
        break

      case "entity.deleted":
        // Handle deletion
        logger.info("Cleaning up deleted entity", { entityId })
        // Perform cleanup logic
        break

      default:
        logger.warn("Unhandled entity lifecycle event", { event: eventName })
    }
  } catch (error) {
    logger.error("Failed to handle entity lifecycle event", {
      event: eventName,
      entityId,
      error: error.message
    })
  }
}

export const config: SubscriberConfig = {
  event: [
    "entity.created",
    "entity.updated",
    "entity.deleted"
  ]
}

// ============================================================================
// SUBSCRIBER WITH CONDITIONAL LOGIC
// ============================================================================

// src/subscribers/order-placed-entity-handler.ts
import {
  type SubscriberArgs,
  type SubscriberConfig
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Subscriber with Conditional Logic
 * Handles events based on specific conditions
 */
export default async function orderPlacedEntityHandler({
  event: { data },
  container
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderModuleService = container.resolve(Modules.ORDER)

  try {
    // Fetch order details
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "items.variant"]
    })

    logger.info("Processing order for entity actions", {
      orderId: order.id
    })

    // Conditional: Only process orders with specific items
    const hasSpecialItems = order.items.some((item: any) =>
      item.metadata?.special_entity === true
    )

    if (!hasSpecialItems) {
      logger.info("Order does not contain special entity items, skipping", {
        orderId: order.id
      })
      return
    }

    // Process special entity items
    for (const item of order.items) {
      if (item.metadata?.special_entity === true) {
        logger.info("Processing special entity item", {
          orderId: order.id,
          itemId: item.id,
          entityId: item.metadata.entity_id
        })

        // Perform entity-specific actions
        // e.g., update inventory, trigger workflows, etc.
      }
    }

    logger.info("Order entity processing completed", {
      orderId: order.id
    })
  } catch (error) {
    logger.error("Failed to process order entity actions", {
      orderId: data.id,
      error: error.message
    })
  }
}

export const config: SubscriberConfig = {
  event: "order.placed"
}

// ============================================================================
// SUBSCRIBER WITH RETRY LOGIC
// ============================================================================

// src/subscribers/entity-sync-external.ts
import {
  type SubscriberArgs,
  type SubscriberConfig
} from "@medusajs/framework"
import { MODULE_NAME } from "../modules/[module-name]"
import ModuleService from "../modules/[module-name]/service"

/**
 * Subscriber with Retry Logic
 * Implements retry mechanism for external API calls
 */
export default async function entitySyncExternalHandler({
  event: { data },
  container
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const moduleService: ModuleService = container.resolve(MODULE_NAME)

  const maxRetries = 3
  let attempt = 0
  let success = false

  while (attempt < maxRetries && !success) {
    attempt++

    try {
      logger.info("Attempting to sync entity to external system", {
        entityId: data.id,
        attempt,
        maxRetries
      })

      // Fetch entity
      const entity = await moduleService.retrieveMainEntity(data.id)

      // Call external API
      // const response = await fetch("https://api.external.com/sync", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(entity)
      // })

      // if (!response.ok) {
      //   throw new Error(`API returned ${response.status}`)
      // }

      // Update entity with sync status
      await moduleService.updateMainEntities({
        id: data.id,
        metadata: {
          ...entity.metadata,
          last_synced_at: new Date().toISOString(),
          sync_status: "success"
        }
      })

      success = true
      logger.info("Entity synced successfully", {
        entityId: data.id,
        attempt
      })
    } catch (error) {
      logger.error("Failed to sync entity", {
        entityId: data.id,
        attempt,
        error: error.message
      })

      if (attempt >= maxRetries) {
        // Max retries reached, update entity with failure status
        try {
          await moduleService.updateMainEntities({
            id: data.id,
            metadata: {
              sync_status: "failed",
              sync_error: error.message,
              failed_at: new Date().toISOString()
            }
          })
        } catch (updateError) {
          logger.error("Failed to update entity with sync failure", {
            entityId: data.id,
            error: updateError.message
          })
        }
      } else {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: "entity.needs_sync"
}

// ============================================================================
// COMMON EVENT NAMES IN MEDUSA
// ============================================================================

/*
Core Medusa Events:

- order.placed
- order.updated
- order.canceled
- order.completed

- product.created
- product.updated
- product.deleted

- customer.created
- customer.updated

- cart.created
- cart.updated

- payment.captured
- payment.refunded

- fulfillment.created
- fulfillment.shipped
- fulfillment.delivered

- auth.password_reset
- user.created

Custom Events:
- You can emit custom events using the Event Bus service
- Convention: use dot notation like "module.action"
- Examples: "entity.published", "entity.needs_sync", etc.
*/
