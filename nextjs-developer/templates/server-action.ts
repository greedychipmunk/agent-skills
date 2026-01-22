/**
 * Server Action Template
 *
 * This template demonstrates Server Actions with:
 * - Form handling
 * - Data mutations
 * - Validation with Zod
 * - Error handling
 * - Revalidation
 * - Optimistic updates pattern
 * - Authentication checks
 *
 * Usage:
 * 1. Copy to app/actions/[action-name].ts or lib/actions/[action-name].ts
 * 2. Replace ENTITY with your resource name
 * 3. Implement your data access logic
 *
 * Location: app/actions.ts or lib/actions/[action-name].ts
 */

"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { z } from "zod"

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

// Validation schemas
const CreateEntitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
})

const UpdateEntitySchema = CreateEntitySchema.partial().extend({
  id: z.string().min(1, "ID is required"),
})

const DeleteEntitySchema = z.object({
  id: z.string().min(1, "ID is required"),
})

// Action result types
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current user from session (implement your auth logic)
 */
async function getCurrentUser() {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get("session")?.value

  if (!sessionToken) {
    return null
  }

  // TODO: Implement your session verification
  // return await verifySession(sessionToken)

  return { id: "user_123", name: "John Doe" }
}

/**
 * Require authentication - throws if not authenticated
 */
async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

/**
 * Parse and validate form data
 */
function parseFormData<T extends z.ZodSchema>(
  schema: T,
  formData: FormData
): z.infer<T> {
  const data: Record<string, unknown> = {}

  formData.forEach((value, key) => {
    // Handle arrays (multiple values with same key)
    if (data[key]) {
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value)
      } else {
        data[key] = [data[key], value]
      }
    } else {
      data[key] = value
    }
  })

  return schema.parse(data)
}

// ============================================================================
// DATA ACCESS (Replace with your implementation)
// ============================================================================

interface Entity {
  id: string
  title: string
  description?: string
  status: "draft" | "published"
  userId: string
  createdAt: Date
  updatedAt: Date
}

async function createEntityInDb(
  data: z.infer<typeof CreateEntitySchema>,
  userId: string
): Promise<Entity> {
  // TODO: Implement actual database insert
  // return await db.entity.create({ data: { ...data, userId } })

  const now = new Date()
  return {
    id: crypto.randomUUID(),
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  }
}

async function updateEntityInDb(
  id: string,
  data: Partial<z.infer<typeof CreateEntitySchema>>,
  userId: string
): Promise<Entity | null> {
  // TODO: Implement actual database update
  // return await db.entity.update({ where: { id, userId }, data })
  return null
}

async function deleteEntityInDb(id: string, userId: string): Promise<boolean> {
  // TODO: Implement actual database delete
  // await db.entity.delete({ where: { id, userId } })
  return true
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Create a new entity
 *
 * Usage in component:
 * ```tsx
 * import { createEntity } from "@/app/actions"
 *
 * <form action={createEntity}>
 *   <input name="title" required />
 *   <button type="submit">Create</button>
 * </form>
 * ```
 */
export async function createEntity(
  formData: FormData
): Promise<ActionResult<Entity>> {
  try {
    // Authenticate
    const user = await requireAuth()

    // Validate input
    const validatedData = parseFormData(CreateEntitySchema, formData)

    // Create entity
    const entity = await createEntityInDb(validatedData, user.id)

    // Revalidate cache
    revalidatePath("/entities")
    revalidateTag("entities")

    return { success: true, data: entity }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "You must be logged in" }
    }

    console.error("createEntity error:", error)
    return { success: false, error: "Failed to create entity" }
  }
}

/**
 * Create entity with redirect on success
 */
export async function createEntityAndRedirect(formData: FormData) {
  const result = await createEntity(formData)

  if (result.success) {
    redirect(`/entities/${result.data.id}`)
  }

  // Return errors to display in form
  return result
}

/**
 * Update an existing entity
 *
 * Usage with useFormState:
 * ```tsx
 * "use client"
 * import { useFormState } from "react-dom"
 * import { updateEntity } from "@/app/actions"
 *
 * const [state, formAction] = useFormState(updateEntity, null)
 *
 * <form action={formAction}>
 *   <input type="hidden" name="id" value={entity.id} />
 *   <input name="title" defaultValue={entity.title} />
 *   <button type="submit">Update</button>
 *   {state?.error && <p>{state.error}</p>}
 * </form>
 * ```
 */
export async function updateEntity(
  _prevState: ActionResult<Entity> | null,
  formData: FormData
): Promise<ActionResult<Entity>> {
  try {
    const user = await requireAuth()

    const validatedData = parseFormData(UpdateEntitySchema, formData)
    const { id, ...updateData } = validatedData

    const entity = await updateEntityInDb(id, updateData, user.id)

    if (!entity) {
      return { success: false, error: "Entity not found" }
    }

    revalidatePath(`/entities/${id}`)
    revalidatePath("/entities")
    revalidateTag("entities")

    return { success: true, data: entity }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    console.error("updateEntity error:", error)
    return { success: false, error: "Failed to update entity" }
  }
}

/**
 * Delete an entity
 *
 * Usage:
 * ```tsx
 * import { deleteEntity } from "@/app/actions"
 *
 * <form action={deleteEntity}>
 *   <input type="hidden" name="id" value={entity.id} />
 *   <button type="submit">Delete</button>
 * </form>
 * ```
 */
export async function deleteEntity(
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const { id } = parseFormData(DeleteEntitySchema, formData)

    const deleted = await deleteEntityInDb(id, user.id)

    if (!deleted) {
      return { success: false, error: "Entity not found" }
    }

    revalidatePath("/entities")
    revalidateTag("entities")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("deleteEntity error:", error)
    return { success: false, error: "Failed to delete entity" }
  }
}

/**
 * Delete with redirect
 */
export async function deleteEntityAndRedirect(formData: FormData) {
  const result = await deleteEntity(formData)

  if (result.success) {
    redirect("/entities")
  }

  return result
}

// ============================================================================
// ACTIONS WITH BOUND ARGUMENTS
// ============================================================================

/**
 * Create action with pre-bound values using .bind()
 *
 * Usage:
 * ```tsx
 * import { toggleEntityStatus } from "@/app/actions"
 *
 * const toggleAction = toggleEntityStatus.bind(null, entity.id)
 *
 * <form action={toggleAction}>
 *   <button type="submit">
 *     {entity.status === "draft" ? "Publish" : "Unpublish"}
 *   </button>
 * </form>
 * ```
 */
export async function toggleEntityStatus(
  entityId: string,
  formData: FormData
): Promise<ActionResult<Entity>> {
  try {
    const user = await requireAuth()

    // Get current status and toggle
    // const entity = await db.entity.findUnique({ where: { id: entityId } })
    // const newStatus = entity.status === "draft" ? "published" : "draft"

    const newStatus = "published" as const // Placeholder

    const updated = await updateEntityInDb(entityId, { status: newStatus }, user.id)

    if (!updated) {
      return { success: false, error: "Entity not found" }
    }

    revalidatePath(`/entities/${entityId}`)
    revalidateTag("entities")

    return { success: true, data: updated }
  } catch (error) {
    console.error("toggleEntityStatus error:", error)
    return { success: false, error: "Failed to update status" }
  }
}

// ============================================================================
// OPTIMISTIC UPDATE PATTERN
// ============================================================================

/**
 * For optimistic updates, use with useOptimistic hook
 *
 * Client component:
 * ```tsx
 * "use client"
 * import { useOptimistic, useTransition } from "react"
 * import { likeEntity } from "@/app/actions"
 *
 * function LikeButton({ entity, initialLikes }: Props) {
 *   const [isPending, startTransition] = useTransition()
 *   const [optimisticLikes, addOptimisticLike] = useOptimistic(
 *     initialLikes,
 *     (current, _) => current + 1
 *   )
 *
 *   async function handleLike() {
 *     startTransition(async () => {
 *       addOptimisticLike(null)
 *       await likeEntity(entity.id)
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleLike} disabled={isPending}>
 *       {optimisticLikes} likes
 *     </button>
 *   )
 * }
 * ```
 */
export async function likeEntity(entityId: string): Promise<ActionResult<{ likes: number }>> {
  try {
    const user = await requireAuth()

    // TODO: Implement like logic
    // await db.like.create({ data: { entityId, userId: user.id } })
    // const likes = await db.like.count({ where: { entityId } })

    const likes = 1 // Placeholder

    revalidatePath(`/entities/${entityId}`)

    return { success: true, data: { likes } }
  } catch (error) {
    console.error("likeEntity error:", error)
    return { success: false, error: "Failed to like" }
  }
}
