/**
 * Complete Workflow Template
 *
 * This template shows a complete workflow structure with:
 * - Multiple steps with input and output
 * - Compensation functions for rollback
 * - Data transformation between steps
 * - Conditional execution
 * - Integration with Medusa modules
 * - Proper error handling
 *
 * Usage: Copy and adapt this structure for your workflows
 * Location: src/workflows/[workflow-name]/
 */

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

// src/workflows/[workflow-name]/steps/validate-input.ts
import {
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"

export type ValidateInputInput = {
  entityId: string
  data: Record<string, any>
}

export type ValidateInputOutput = {
  isValid: boolean
  validatedData: Record<string, any>
  errors: string[]
}

/**
 * Step 1: Validate Input Data
 * This step validates the input before processing
 */
export const validateInputStep = createStep(
  "validate-input",
  async (input: ValidateInputInput, { container }) => {
    const logger = container.resolve("logger")

    logger.info("Validating input data", { entityId: input.entityId })

    // Validation logic
    const errors: string[] = []

    if (!input.data.name) {
      errors.push("Name is required")
    }

    if (input.data.price && input.data.price < 0) {
      errors.push("Price must be positive")
    }

    const isValid = errors.length === 0

    logger.info("Validation complete", { isValid, errors })

    return new StepResponse({
      isValid,
      validatedData: input.data,
      errors
    })
  }
)

// ----------------------------------------------------------------------------

// src/workflows/[workflow-name]/steps/fetch-entity.ts
import {
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"
import { MODULE_NAME } from "../../../modules/[module-name]"
import ModuleService from "../../../modules/[module-name]/service"

export type FetchEntityInput = {
  entityId: string
}

/**
 * Step 2: Fetch Entity from Module
 * Retrieves the entity from the custom module
 */
export const fetchEntityStep = createStep(
  "fetch-entity",
  async (input: FetchEntityInput, { container }) => {
    const logger = container.resolve("logger")
    const moduleService: ModuleService = container.resolve(MODULE_NAME)

    logger.info("Fetching entity", { entityId: input.entityId })

    const entity = await moduleService.retrieveMainEntity(input.entityId)

    if (!entity) {
      throw new Error(`Entity with ID ${input.entityId} not found`)
    }

    logger.info("Entity fetched successfully", { entityId: entity.id })

    return new StepResponse(entity)
  }
)

// ----------------------------------------------------------------------------

// src/workflows/[workflow-name]/steps/process-entity.ts
import {
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"
import { MODULE_NAME } from "../../../modules/[module-name]"
import ModuleService from "../../../modules/[module-name]/service"

export type ProcessEntityInput = {
  entityId: string
  updates: Record<string, any>
}

export type ProcessEntityOutput = {
  id: string
  previousState: Record<string, any>
  newState: Record<string, any>
}

/**
 * Step 3: Process and Update Entity
 * Updates the entity with compensation for rollback
 */
export const processEntityStep = createStep(
  "process-entity",
  async (input: ProcessEntityInput, { container }) => {
    const logger = container.resolve("logger")
    const moduleService: ModuleService = container.resolve(MODULE_NAME)

    logger.info("Processing entity", {
      entityId: input.entityId,
      updates: input.updates
    })

    // Fetch current state for rollback
    const currentEntity = await moduleService.retrieveMainEntity(input.entityId)

    const previousState = {
      name: currentEntity.name,
      description: currentEntity.description,
      is_active: currentEntity.is_active
    }

    // Update the entity
    const updatedEntity = await moduleService.updateMainEntities({
      id: input.entityId,
      ...input.updates
    })

    logger.info("Entity processed successfully", { entityId: updatedEntity.id })

    return new StepResponse(
      {
        id: updatedEntity.id,
        previousState,
        newState: updatedEntity
      },
      {
        // Data available in compensation function
        entityId: input.entityId,
        previousState
      }
    )
  },
  // Compensation function - rolls back changes on error
  async (data, { container }) => {
    if (!data) return

    const logger = container.resolve("logger")
    const moduleService: ModuleService = container.resolve(MODULE_NAME)

    logger.warn("Rolling back entity changes", {
      entityId: data.entityId
    })

    try {
      await moduleService.updateMainEntities({
        id: data.entityId,
        ...data.previousState
      })

      logger.info("Entity rollback completed", {
        entityId: data.entityId
      })
    } catch (error) {
      logger.error("Failed to rollback entity", {
        entityId: data.entityId,
        error: error.message
      })
    }
  }
)

// ----------------------------------------------------------------------------

// src/workflows/[workflow-name]/steps/notify-external-system.ts
import {
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"

export type NotifyExternalSystemInput = {
  entityId: string
  eventType: string
  data: Record<string, any>
}

/**
 * Step 4: Notify External System
 * Sends notification to external system with compensation
 */
export const notifyExternalSystemStep = createStep(
  "notify-external-system",
  async (input: NotifyExternalSystemInput, { container }) => {
    const logger = container.resolve("logger")

    logger.info("Notifying external system", {
      entityId: input.entityId,
      eventType: input.eventType
    })

    // Simulate external API call
    try {
      // const response = await fetch("https://api.external-system.com/notify", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     entity_id: input.entityId,
      //     event_type: input.eventType,
      //     data: input.data
      //   })
      // })

      const notificationId = "notif_123" // response.id

      logger.info("External system notified", { notificationId })

      return new StepResponse(
        { notificationId },
        { notificationId } // For compensation
      )
    } catch (error) {
      logger.error("Failed to notify external system", { error: error.message })
      throw error
    }
  },
  // Compensation - send cancellation to external system
  async (data, { container }) => {
    if (!data) return

    const logger = container.resolve("logger")

    logger.warn("Cancelling external notification", {
      notificationId: data.notificationId
    })

    try {
      // await fetch(`https://api.external-system.com/notify/${data.notificationId}/cancel`, {
      //   method: "POST"
      // })

      logger.info("External notification cancelled")
    } catch (error) {
      logger.error("Failed to cancel notification", { error: error.message })
    }
  }
)

// ============================================================================
// WORKFLOW COMPOSITION
// ============================================================================

// src/workflows/[workflow-name]/index.ts
import {
  createWorkflow,
  WorkflowResponse,
  transform,
  when
} from "@medusajs/framework/workflows-sdk"
import {
  validateInputStep,
  ValidateInputInput
} from "./steps/validate-input"
import {
  fetchEntityStep
} from "./steps/fetch-entity"
import {
  processEntityStep
} from "./steps/process-entity"
import {
  notifyExternalSystemStep
} from "./steps/notify-external-system"

export type ProcessEntityWorkflowInput = {
  entityId: string
  data: Record<string, any>
  notifyExternal?: boolean
}

export type ProcessEntityWorkflowOutput = {
  entity: any
  notificationSent: boolean
}

/**
 * Complete Workflow: Process Entity
 *
 * This workflow:
 * 1. Validates input data
 * 2. Fetches the entity
 * 3. Processes and updates the entity
 * 4. Conditionally notifies external system
 * 5. Returns the result
 */
export const processEntityWorkflow = createWorkflow(
  "process-entity",
  function (input: ProcessEntityWorkflowInput) {
    // Step 1: Validate input
    const validationResult = validateInputStep({
      entityId: input.entityId,
      data: input.data
    })

    // Transform: Check if validation passed
    const shouldProceed = transform(
      { validationResult },
      (data) => data.validationResult.isValid
    )

    // Conditional: Only proceed if validation passed
    const processResult = when(
      { shouldProceed, validationResult },
      ({ shouldProceed }) => shouldProceed
    ).then(() => {
      // Step 2: Fetch the entity
      const entity = fetchEntityStep({
        entityId: input.entityId
      })

      // Step 3: Transform data for processing
      const processData = transform(
        { entity, validationResult, input },
        (data) => ({
          entityId: input.entityId,
          updates: {
            ...data.validationResult.validatedData,
            // Merge with existing entity data if needed
          }
        })
      )

      // Step 4: Process the entity
      const processed = processEntityStep(processData)

      return processed
    })

    // Conditional: Notify external system if requested
    const notificationResult = when(
      { input, processResult },
      ({ input }) => input.notifyExternal === true
    ).then(({ processResult }) => {
      const notificationData = transform(
        { processResult },
        (data) => ({
          entityId: data.processResult.id,
          eventType: "entity.updated",
          data: data.processResult.newState
        })
      )

      return notifyExternalSystemStep(notificationData)
    })

    // Transform final result
    const finalResult = transform(
      { processResult, notificationResult, input },
      (data) => ({
        entity: data.processResult?.newState || null,
        notificationSent: data.input.notifyExternal === true && !!data.notificationResult
      })
    )

    return new WorkflowResponse(finalResult)
  }
)

export default processEntityWorkflow

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// In an API route:
import processEntityWorkflow from "../../workflows/[workflow-name]"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { entityId } = req.params
  const { data, notifyExternal } = req.body

  try {
    const { result } = await processEntityWorkflow(req.scope).run({
      input: {
        entityId,
        data,
        notifyExternal: notifyExternal || false
      }
    })

    res.json({
      success: true,
      entity: result.entity,
      notificationSent: result.notificationSent
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to process entity"
    })
  }
}

// In a subscriber:
import processEntityWorkflow from "../workflows/[workflow-name]"

export default async function handler({ event, container }) {
  const { entityId, data } = event.data

  await processEntityWorkflow(container).run({
    input: {
      entityId,
      data,
      notifyExternal: true
    }
  })
}

// In a scheduled job:
import processEntityWorkflow from "../../workflows/[workflow-name]"

export default async function (container: MedusaContainer) {
  const moduleService = container.resolve(MODULE_NAME)

  // Get entities that need processing
  const entities = await moduleService.listMainEntities({
    requires_processing: true
  })

  // Process each entity
  for (const entity of entities) {
    await processEntityWorkflow(container).run({
      input: {
        entityId: entity.id,
        data: { processed: true },
        notifyExternal: true
      }
    })
  }
}
*/
