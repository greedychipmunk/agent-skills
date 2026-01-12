# MedusaJS Workflows and Scheduled Jobs

## Scheduled Jobs

### Basic Job Structure
```typescript
// src/jobs/cleanup-expired-carts.ts
import { MedusaContainer } from "@medusajs/framework/types"

export default async function cleanupExpiredCartsJob(container: MedusaContainer) {
  console.log("Starting expired carts cleanup...")
  
  const cartService = container.resolve("cartService")
  const eventBusService = container.resolve("eventBusService")
  
  // Find carts older than 7 days with no activity
  const expiredCarts = await cartService.listCarts({
    created_at: {
      lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    completed_at: null
  })
  
  let deletedCount = 0
  
  for (const cart of expiredCarts) {
    try {
      await cartService.deleteCart(cart.id)
      deletedCount++
      
      // Emit event for tracking
      await eventBusService.emit("cart.expired", {
        cart_id: cart.id,
        created_at: cart.created_at
      })
    } catch (error) {
      console.error(`Failed to delete cart ${cart.id}:`, error)
    }
  }
  
  console.log(`Cleanup completed. Deleted ${deletedCount} expired carts.`)
}

export const config = {
  name: "cleanup-expired-carts",
  schedule: "0 2 * * *" // Run daily at 2 AM
}
```

### Inventory Synchronization Job
```typescript
// src/jobs/sync-inventory.ts
import { MedusaContainer } from "@medusajs/framework/types"

export default async function syncInventoryJob(container: MedusaContainer) {
  console.log("Starting inventory synchronization...")
  
  const productService = container.resolve("productService")
  const inventoryService = container.resolve("inventoryService")
  const externalInventoryService = container.resolve("externalInventoryService")
  
  try {
    // Get all product variants
    const variants = await productService.listProductVariants({
      take: 1000 // Process in batches
    })
    
    // Get external inventory levels
    const skus = variants.map(variant => variant.sku).filter(Boolean)
    const externalInventory = await externalInventoryService.getInventoryLevels(skus)
    
    const updates = []
    
    for (const variant of variants) {
      if (!variant.sku) continue
      
      const externalLevel = externalInventory.find(item => item.sku === variant.sku)
      if (!externalLevel) continue
      
      const currentLevel = await inventoryService.getInventoryLevel(variant.inventory_item_id)
      
      if (currentLevel.stocked_quantity !== externalLevel.quantity) {
        updates.push({
          inventory_item_id: variant.inventory_item_id,
          location_id: externalLevel.location_id,
          stocked_quantity: externalLevel.quantity
        })
      }
    }
    
    // Apply updates in batches
    const batchSize = 50
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      await inventoryService.updateInventoryLevels(batch)
    }
    
    console.log(`Inventory sync completed. Updated ${updates.length} items.`)
    
  } catch (error) {
    console.error("Inventory sync failed:", error)
    
    // Send alert for critical failures
    const notificationService = container.resolve("notificationService")
    await notificationService.sendAlert({
      type: "inventory_sync_failure",
      message: error.message,
      severity: "high"
    })
  }
}

export const config = {
  name: "sync-inventory",
  schedule: "0 */6 * * *" // Every 6 hours
}
```

### Order Processing Job
```typescript
// src/jobs/process-pending-orders.ts
import { MedusaContainer } from "@medusajs/framework/types"

export default async function processPendingOrdersJob(container: MedusaContainer) {
  console.log("Processing pending orders...")
  
  const orderService = container.resolve("orderService")
  const paymentService = container.resolve("paymentService")
  const fulfillmentService = container.resolve("fulfillmentService")
  const emailService = container.resolve("emailService")
  
  // Get orders that are paid but not fulfilled
  const pendingOrders = await orderService.listOrders({
    payment_status: "captured",
    fulfillment_status: "not_fulfilled"
  })
  
  for (const order of pendingOrders) {
    try {
      // Check if all items are in stock
      const canFulfill = await fulfillmentService.canFulfillOrder(order.id)
      
      if (canFulfill) {
        // Create fulfillment
        const fulfillment = await fulfillmentService.createFulfillment(order.id, {
          items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
        
        // Generate shipping label if needed
        if (order.shipping_methods.length > 0) {
          const label = await fulfillmentService.createShippingLabel(fulfillment.id)
          
          // Send shipping notification
          await emailService.sendShippingNotification(
            order,
            label.tracking_number
          )
        }
        
        console.log(`Order ${order.display_id} fulfilled successfully`)
        
      } else {
        // Log orders that can't be fulfilled
        console.log(`Order ${order.display_id} cannot be fulfilled - insufficient inventory`)
        
        // Optional: Send notification to admin
        const notificationService = container.resolve("notificationService")
        await notificationService.notifyAdmin({
          type: "insufficient_inventory",
          order_id: order.id,
          display_id: order.display_id
        })
      }
      
    } catch (error) {
      console.error(`Failed to process order ${order.display_id}:`, error)
    }
  }
  
  console.log(`Processed ${pendingOrders.length} pending orders`)
}

export const config = {
  name: "process-pending-orders",
  schedule: "*/15 * * * *" // Every 15 minutes during business hours
}
```

### Analytics Data Collection Job
```typescript
// src/jobs/collect-analytics-data.ts
import { MedusaContainer } from "@medusajs/framework/types"

export default async function collectAnalyticsDataJob(container: MedusaContainer) {
  console.log("Collecting analytics data...")
  
  const orderService = container.resolve("orderService")
  const productService = container.resolve("productService")
  const customerService = container.resolve("customerService")
  const analyticsService = container.resolve("analyticsService")
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  const today = new Date(yesterday)
  today.setDate(today.getDate() + 1)
  
  try {
    // Collect daily metrics
    const [orders, newCustomers, topProducts] = await Promise.all([
      // Orders metrics
      orderService.listOrders({
        created_at: {
          gte: yesterday,
          lt: today
        }
      }),
      
      // New customers
      customerService.listCustomers({
        created_at: {
          gte: yesterday,
          lt: today
        }
      }),
      
      // Top selling products
      productService.getTopSellingProducts({
        period: "daily",
        date: yesterday
      })
    ])
    
    const metrics = {
      date: yesterday.toISOString().split('T')[0],
      orders: {
        count: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + order.total, 0),
        average_order_value: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length 
          : 0
      },
      customers: {
        new_count: newCustomers.length,
        returning_count: orders.filter(order => 
          !newCustomers.find(customer => customer.id === order.customer_id)
        ).length
      },
      products: {
        top_selling: topProducts.slice(0, 10).map(product => ({
          id: product.id,
          title: product.title,
          units_sold: product.units_sold,
          revenue: product.revenue
        }))
      }
    }
    
    // Store metrics
    await analyticsService.storeDailyMetrics(metrics)
    
    // Send daily report to admins
    const reportService = container.resolve("reportService")
    await reportService.sendDailyReport(metrics)
    
    console.log(`Analytics data collected for ${metrics.date}`)
    
  } catch (error) {
    console.error("Analytics collection failed:", error)
  }
}

export const config = {
  name: "collect-analytics-data",
  schedule: "0 1 * * *" // Daily at 1 AM
}
```

## Event-Driven Workflows

### Order Workflow
```typescript
// src/workflows/order-processing.ts
import { 
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"

// Individual steps
const validateOrderStep = createStep(
  "validate-order",
  async (input: { order_id: string }, { container }) => {
    const orderService = container.resolve("orderService")
    const order = await orderService.retrieveOrder(input.order_id)
    
    if (!order) {
      throw new Error("Order not found")
    }
    
    if (order.payment_status !== "captured") {
      throw new Error("Payment not captured")
    }
    
    return new StepResponse({ order })
  }
)

const checkInventoryStep = createStep(
  "check-inventory", 
  async (input: { order: any }, { container }) => {
    const inventoryService = container.resolve("inventoryService")
    
    const insufficientItems = []
    
    for (const item of input.order.items) {
      const level = await inventoryService.getInventoryLevel(item.variant.inventory_item_id)
      if (level.stocked_quantity < item.quantity) {
        insufficientItems.push({
          variant_id: item.variant_id,
          requested: item.quantity,
          available: level.stocked_quantity
        })
      }
    }
    
    if (insufficientItems.length > 0) {
      return new StepResponse(
        { canFulfill: false, insufficientItems },
        { canFulfill: false, insufficientItems }
      )
    }
    
    return new StepResponse({ canFulfill: true })
  }
)

const reserveInventoryStep = createStep(
  "reserve-inventory",
  async (input: { order: any }, { container }) => {
    const inventoryService = container.resolve("inventoryService")
    
    const reservations = []
    
    for (const item of input.order.items) {
      const reservation = await inventoryService.createReservation({
        inventory_item_id: item.variant.inventory_item_id,
        quantity: item.quantity,
        location_id: item.variant.manage_inventory ? undefined : "default_location"
      })
      
      reservations.push(reservation)
    }
    
    return new StepResponse({ reservations })
  },
  
  // Compensation function (rollback)
  async (input: { reservations: any[] }, { container }) => {
    const inventoryService = container.resolve("inventoryService")
    
    for (const reservation of input.reservations) {
      await inventoryService.deleteReservation(reservation.id)
    }
  }
)

const createFulfillmentStep = createStep(
  "create-fulfillment",
  async (input: { order: any }, { container }) => {
    const fulfillmentService = container.resolve("fulfillmentService")
    
    const fulfillment = await fulfillmentService.createFulfillment(input.order.id, {
      items: input.order.items.map(item => ({
        id: item.id,
        quantity: item.quantity
      }))
    })
    
    return new StepResponse({ fulfillment })
  }
)

const sendNotificationStep = createStep(
  "send-notification",
  async (input: { order: any; fulfillment: any }, { container }) => {
    const emailService = container.resolve("emailService")
    
    await emailService.sendFulfillmentNotification({
      order: input.order,
      fulfillment: input.fulfillment
    })
    
    return new StepResponse({ notificationSent: true })
  }
)

// Compose workflow
export const orderProcessingWorkflow = createWorkflow(
  "order-processing",
  function (input: { order_id: string }) {
    const { order } = validateOrderStep({ order_id: input.order_id })
    
    const inventoryCheck = checkInventoryStep({ order })
    
    // Conditional logic
    const reservation = reserveInventoryStep({ order })
    const fulfillment = createFulfillmentStep({ order })
    const notification = sendNotificationStep({ order, fulfillment })
    
    return new WorkflowResponse({
      order,
      fulfillment,
      inventoryReserved: true,
      notificationSent: notification.notificationSent
    })
  }
)
```

### Customer Registration Workflow
```typescript
// src/workflows/customer-registration.ts
const validateCustomerDataStep = createStep(
  "validate-customer-data",
  async (input: {
    email: string
    password: string
    first_name: string
    last_name: string
  }, { container }) => {
    const customerService = container.resolve("customerService")
    
    // Check if email already exists
    const existingCustomer = await customerService.retrieveByEmail(input.email)
    if (existingCustomer) {
      throw new Error("Customer with this email already exists")
    }
    
    // Validate password strength
    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters long")
    }
    
    return new StepResponse(input)
  }
)

const createCustomerStep = createStep(
  "create-customer",
  async (input: {
    email: string
    password: string
    first_name: string
    last_name: string
  }, { container }) => {
    const customerService = container.resolve("customerService")
    
    const customer = await customerService.createCustomer({
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name
    })
    
    return new StepResponse({ customer })
  }
)

const createAuthUserStep = createStep(
  "create-auth-user",
  async (input: {
    customer: any
    email: string
    password: string
  }, { container }) => {
    const authService = container.resolve("authService")
    
    const authUser = await authService.createAuthUser({
      provider_id: "emailpass",
      user_metadata: {
        customer_id: input.customer.id,
        email: input.email
      },
      provider_metadata: {
        email: input.email,
        password: input.password
      }
    })
    
    return new StepResponse({ authUser })
  }
)

const sendWelcomeEmailStep = createStep(
  "send-welcome-email",
  async (input: { customer: any }, { container }) => {
    const emailService = container.resolve("emailService")
    
    await emailService.sendWelcomeEmail({
      to: input.customer.email,
      customerName: `${input.customer.first_name} ${input.customer.last_name}`
    })
    
    return new StepResponse({ emailSent: true })
  }
)

const assignToCustomerGroupStep = createStep(
  "assign-customer-group",
  async (input: { customer: any }, { container }) => {
    const customerService = container.resolve("customerService")
    
    // Assign to default customer group
    await customerService.addCustomerToGroup(input.customer.id, "default_customers")
    
    return new StepResponse({ groupAssigned: true })
  }
)

export const customerRegistrationWorkflow = createWorkflow(
  "customer-registration",
  function (input: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) {
    const validatedData = validateCustomerDataStep(input)
    const { customer } = createCustomerStep(validatedData)
    const { authUser } = createAuthUserStep({ 
      customer, 
      email: input.email, 
      password: input.password 
    })
    const welcomeEmail = sendWelcomeEmailStep({ customer })
    const groupAssignment = assignToCustomerGroupStep({ customer })
    
    return new WorkflowResponse({
      customer,
      authUser,
      emailSent: welcomeEmail.emailSent,
      groupAssigned: groupAssignment.groupAssigned
    })
  }
)
```

## Workflow Execution

### Triggering Workflows
```typescript
// src/api/workflows/execute/route.ts
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { workflow_id, input } = req.body
  
  try {
    let result
    
    switch (workflow_id) {
      case "order-processing":
        result = await orderProcessingWorkflow(req.scope).run(input)
        break
      case "customer-registration":
        result = await customerRegistrationWorkflow(req.scope).run(input)
        break
      default:
        return res.status(400).json({ 
          error: `Unknown workflow: ${workflow_id}` 
        })
    }
    
    res.json({ 
      success: true, 
      result: result.result,
      transaction_id: result.transaction.id
    })
    
  } catch (error) {
    console.error(`Workflow execution failed: ${error.message}`)
    res.status(500).json({ 
      error: "Workflow execution failed",
      details: error.message 
    })
  }
}
```

### Workflow Monitoring
```typescript
// src/services/workflow-monitor.ts
class WorkflowMonitorService {
  constructor(private container: any) {}
  
  async getWorkflowStatus(transactionId: string) {
    const workflowEngine = this.container.resolve("workflowEngine")
    return await workflowEngine.getTransaction(transactionId)
  }
  
  async retryFailedWorkflow(transactionId: string) {
    const workflowEngine = this.container.resolve("workflowEngine")
    return await workflowEngine.retryTransaction(transactionId)
  }
  
  async getFailedWorkflows(limit = 50) {
    const workflowEngine = this.container.resolve("workflowEngine")
    return await workflowEngine.listTransactions({
      status: "failed",
      limit
    })
  }
  
  async cancelWorkflow(transactionId: string) {
    const workflowEngine = this.container.resolve("workflowEngine")
    return await workflowEngine.cancelTransaction(transactionId)
  }
}
```

## Cron Expression Examples

```typescript
// Common cron patterns for scheduled jobs

export const cronExpressions = {
  // Every minute
  everyMinute: "* * * * *",
  
  // Every 5 minutes
  every5Minutes: "*/5 * * * *",
  
  // Every 15 minutes
  every15Minutes: "*/15 * * * *",
  
  // Every hour at minute 0
  hourly: "0 * * * *",
  
  // Every 6 hours
  every6Hours: "0 */6 * * *",
  
  // Daily at 2:00 AM
  daily2AM: "0 2 * * *",
  
  // Daily at midnight
  dailyMidnight: "0 0 * * *",
  
  // Weekly on Sunday at 3:00 AM
  weeklySunday: "0 3 * * 0",
  
  // Monthly on the 1st at 4:00 AM
  monthlyFirst: "0 4 1 * *",
  
  // Weekdays only at 9:00 AM
  weekdays9AM: "0 9 * * 1-5",
  
  // Business hours every 30 minutes
  businessHours: "*/30 9-17 * * 1-5"
}
```

## Error Handling and Monitoring

### Job Error Handling
```typescript
// src/jobs/base-job.ts
export abstract class BaseJob {
  protected maxRetries = 3
  protected retryDelay = 5000 // 5 seconds
  
  abstract execute(container: MedusaContainer): Promise<void>
  
  async run(container: MedusaContainer) {
    let attempt = 0
    
    while (attempt < this.maxRetries) {
      try {
        await this.execute(container)
        break
      } catch (error) {
        attempt++
        console.error(`Job failed (attempt ${attempt}/${this.maxRetries}):`, error)
        
        if (attempt === this.maxRetries) {
          await this.handleFinalFailure(error, container)
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
      }
    }
  }
  
  protected async handleFinalFailure(error: Error, container: MedusaContainer) {
    const notificationService = container.resolve("notificationService")
    await notificationService.sendAlert({
      type: "job_failure",
      jobName: this.constructor.name,
      error: error.message,
      severity: "high"
    })
  }
}
```