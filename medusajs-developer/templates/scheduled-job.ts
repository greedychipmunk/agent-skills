/**
 * Scheduled Job Templates
 *
 * This template shows various scheduled job patterns:
 * - Basic scheduled job
 * - Job with error handling
 * - Job that processes batches
 * - Job with workflow execution
 * - Job with external API integration
 * - Common cron patterns
 *
 * Usage: Copy and adapt these patterns for your scheduled jobs
 * Location: src/jobs/[job-name].ts
 */

import { MedusaContainer } from "@medusajs/framework/types"

// ============================================================================
// BASIC SCHEDULED JOB
// ============================================================================

/**
 * Basic Scheduled Job
 * Runs a simple task on a schedule
 */
export default async function basicScheduledJob(container: MedusaContainer) {
  const logger = container.resolve("logger")

  logger.info("Running basic scheduled job")

  try {
    // Perform your scheduled task
    logger.info("Basic scheduled job completed successfully")
  } catch (error) {
    logger.error("Basic scheduled job failed", { error: error.message })
    throw error
  }
}

export const config = {
  name: "basic-scheduled-job",
  // Run every hour
  schedule: "0 * * * *"
}

// ============================================================================
// JOB WITH SERVICE RESOLUTION
// ============================================================================

/*
// src/jobs/sync-inventory.ts

import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { INVENTORY_MODULE } from "../modules/inventory"
import InventoryModuleService from "../modules/inventory/service"

export default async function syncInventoryJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const inventoryService: InventoryModuleService = container.resolve(
    INVENTORY_MODULE
  )
  const productModuleService = container.resolve(Modules.PRODUCT)

  logger.info("Starting inventory sync job")

  try {
    // Get all products
    const products = await productModuleService.listProducts()

    logger.info(`Syncing inventory for ${products.length} products`)

    for (const product of products) {
      // Sync inventory for each product
      await inventoryService.syncProductInventory({
        productId: product.id,
        externalSystemId: product.metadata?.external_id
      })
    }

    logger.info("Inventory sync completed successfully")
  } catch (error) {
    logger.error("Inventory sync failed", { error: error.message })
    throw error
  }
}

export const config = {
  name: "sync-inventory",
  // Run every 6 hours
  schedule: "0 */6 * * *"
}
*/

// ============================================================================
// BATCH PROCESSING JOB
// ============================================================================

/*
// src/jobs/process-pending-entities.ts

import { MedusaContainer } from "@medusajs/framework/types"
import { MODULE_NAME } from "../modules/entity"
import ModuleService from "../modules/entity/service"

export default async function processPendingEntitiesJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const moduleService: ModuleService = container.resolve(MODULE_NAME)

  const BATCH_SIZE = 100
  let offset = 0
  let processedCount = 0
  let failedCount = 0

  logger.info("Starting batch processing job")

  try {
    while (true) {
      // Fetch a batch of pending entities
      const entities = await moduleService.listMainEntities(
        {
          status: "pending"
        },
        {
          take: BATCH_SIZE,
          skip: offset
        }
      )

      if (entities.length === 0) {
        break // No more entities to process
      }

      logger.info(`Processing batch of ${entities.length} entities`, {
        offset,
        batchSize: BATCH_SIZE
      })

      // Process each entity in the batch
      for (const entity of entities) {
        try {
          // Perform processing logic
          await moduleService.updateMainEntities({
            id: entity.id,
            status: "processed",
            processed_at: new Date()
          })

          processedCount++
        } catch (error) {
          logger.error("Failed to process entity", {
            entityId: entity.id,
            error: error.message
          })

          failedCount++

          // Mark entity as failed
          await moduleService.updateMainEntities({
            id: entity.id,
            status: "failed",
            error_message: error.message
          })
        }
      }

      offset += BATCH_SIZE
    }

    logger.info("Batch processing completed", {
      processed: processedCount,
      failed: failedCount
    })
  } catch (error) {
    logger.error("Batch processing job failed", {
      error: error.message,
      processed: processedCount,
      failed: failedCount
    })
    throw error
  }
}

export const config = {
  name: "process-pending-entities",
  // Run every 15 minutes
  schedule: "*/15 * * * *"
}
*/

// ============================================================================
// JOB WITH WORKFLOW EXECUTION
// ============================================================================

/*
// src/jobs/daily-report.ts

import { MedusaContainer } from "@medusajs/framework/types"
import { generateDailyReportWorkflow } from "../workflows/generate-daily-report"

export default async function dailyReportJob(container: MedusaContainer) {
  const logger = container.resolve("logger")

  logger.info("Starting daily report generation")

  try {
    const { result } = await generateDailyReportWorkflow(container).run({
      input: {
        date: new Date(),
        includeAnalytics: true
      }
    })

    logger.info("Daily report generated successfully", {
      reportId: result.reportId
    })
  } catch (error) {
    logger.error("Daily report generation failed", { error: error.message })
    throw error
  }
}

export const config = {
  name: "daily-report",
  // Run daily at 9 AM
  schedule: "0 9 * * *"
}
*/

// ============================================================================
// JOB WITH EXTERNAL API INTEGRATION
// ============================================================================

/*
// src/jobs/sync-to-external-system.ts

import { MedusaContainer } from "@medusajs/framework/types"
import { MODULE_NAME } from "../modules/entity"
import ModuleService from "../modules/entity/service"

export default async function syncToExternalSystemJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const moduleService: ModuleService = container.resolve(MODULE_NAME)

  logger.info("Starting external system sync")

  try {
    // Get entities that need syncing
    const entities = await moduleService.listMainEntities({
      $or: [
        { last_synced_at: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        { last_synced_at: null }
      ]
    })

    logger.info(`Found ${entities.length} entities to sync`)

    let successCount = 0
    let failureCount = 0

    for (const entity of entities) {
      try {
        // Call external API
        const response = await fetch("https://api.external-system.com/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.EXTERNAL_API_KEY}`
          },
          body: JSON.stringify({
            id: entity.id,
            name: entity.name,
            data: entity.metadata
          })
        })

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const result = await response.json()

        // Update entity with sync status
        await moduleService.updateMainEntities({
          id: entity.id,
          metadata: {
            ...entity.metadata,
            last_synced_at: new Date().toISOString(),
            external_id: result.id,
            sync_status: "success"
          }
        })

        successCount++
      } catch (error) {
        logger.error("Failed to sync entity", {
          entityId: entity.id,
          error: error.message
        })

        // Update entity with failure status
        await moduleService.updateMainEntities({
          id: entity.id,
          metadata: {
            ...entity.metadata,
            sync_status: "failed",
            sync_error: error.message
          }
        })

        failureCount++
      }
    }

    logger.info("External system sync completed", {
      success: successCount,
      failed: failureCount
    })
  } catch (error) {
    logger.error("External system sync job failed", { error: error.message })
    throw error
  }
}

export const config = {
  name: "sync-to-external-system",
  // Run every 30 minutes
  schedule: "*/30 * * * *"
}
*/

// ============================================================================
// JOB WITH CLEANUP LOGIC
// ============================================================================

/*
// src/jobs/cleanup-old-records.ts

import { MedusaContainer } from "@medusajs/framework/types"
import { MODULE_NAME } from "../modules/entity"
import ModuleService from "../modules/entity/service"

export default async function cleanupOldRecordsJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const moduleService: ModuleService = container.resolve(MODULE_NAME)

  // Delete records older than 90 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  logger.info("Starting cleanup of old records", {
    cutoffDate: cutoffDate.toISOString()
  })

  try {
    // Find old records
    const oldRecords = await moduleService.listMainEntities({
      deleted_at: { $lt: cutoffDate }
    })

    logger.info(`Found ${oldRecords.length} old records to delete`)

    // Permanently delete old records
    for (const record of oldRecords) {
      await moduleService.deleteMainEntities(record.id)
    }

    logger.info("Cleanup completed successfully", {
      deletedCount: oldRecords.length
    })
  } catch (error) {
    logger.error("Cleanup job failed", { error: error.message })
    throw error
  }
}

export const config = {
  name: "cleanup-old-records",
  // Run daily at midnight
  schedule: "0 0 * * *"
}
*/

// ============================================================================
// COMMON CRON PATTERNS
// ============================================================================

/*
CRON EXPRESSION FORMAT: minute hour day month weekday

Examples:

Every minute:
schedule: "* * * * *"

Every 5 minutes:
schedule: "*\/5 * * * *"

Every 15 minutes:
schedule: "*\/15 * * * *"

Every 30 minutes:
schedule: "*\/30 * * * *"

Every hour:
schedule: "0 * * * *"

Every 2 hours:
schedule: "0 *\/2 * * *"

Every 6 hours:
schedule: "0 *\/6 * * *"

Daily at midnight:
schedule: "0 0 * * *"

Daily at 9 AM:
schedule: "0 9 * * *"

Daily at 6 PM:
schedule: "0 18 * * *"

Twice daily (9 AM and 6 PM):
schedule: "0 9,18 * * *"

Every weekday at 9 AM:
schedule: "0 9 * * 1-5"

Every Monday at 9 AM:
schedule: "0 9 * * 1"

Every Sunday at midnight:
schedule: "0 0 * * 0"

First day of month at midnight:
schedule: "0 0 1 * *"

First day of month at 9 AM:
schedule: "0 9 1 * *"

Last day of month (approximately):
schedule: "0 0 28-31 * *"

Every quarter (Jan, Apr, Jul, Oct) on 1st at midnight:
schedule: "0 0 1 1,4,7,10 *"

Complex example - Every 10 minutes between 9 AM and 5 PM on weekdays:
schedule: "*\/10 9-17 * * 1-5"

Visit https://crontab.guru/ for help creating and testing cron expressions
*/

// ============================================================================
// ERROR HANDLING BEST PRACTICES
// ============================================================================

/*
1. Always log start and end of job execution
2. Use try-catch to handle errors gracefully
3. Log detailed error information for debugging
4. Consider implementing retry logic for transient failures
5. Update database with job execution status
6. Send notifications for critical job failures
7. Implement circuit breakers for external API calls
8. Use batch processing for large datasets
9. Implement timeouts to prevent hanging jobs
10. Monitor job execution duration and success rates
*/

// ============================================================================
// TESTING SCHEDULED JOBS
// ============================================================================

/*
To test a scheduled job manually:

1. Export the job function without the config:

export { default as testJob } from "./src/jobs/my-job"

2. Create a test script or API route:

import testJob from "./src/jobs/my-job"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    await testJob(req.scope)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

3. Or test directly in development:

Terminal:
npm run dev

The job will run according to its schedule
Watch the logs for execution messages
*/
