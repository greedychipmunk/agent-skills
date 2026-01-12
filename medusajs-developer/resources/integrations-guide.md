# MedusaJS Third-Party Integrations Guide

## Integration Architecture

### Service-Based Integration Pattern
```typescript
// src/services/external-integration.ts
abstract class ExternalIntegrationService {
  protected apiKey: string
  protected baseUrl: string
  protected timeout: number = 30000
  
  constructor(config: {
    apiKey: string
    baseUrl: string
    timeout?: number
  }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
  }
  
  protected async makeRequest<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE"
      data?: any
      headers?: Record<string, string>
    } = {}
  ): Promise<T> {
    const { method = "GET", data, headers = {} } = options
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.timeout)
      })
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Integration error for ${endpoint}:`, error)
      throw error
    }
  }
  
  protected abstract validateConfig(): boolean
  abstract healthCheck(): Promise<boolean>
}
```

## Payment Gateway Integration

### Stripe Integration
```typescript
// src/services/stripe-payment.ts
import Stripe from "stripe"
import { ExternalIntegrationService } from "./external-integration"

class StripePaymentService extends ExternalIntegrationService {
  private stripe: Stripe
  
  constructor(config: { secretKey: string; webhookSecret: string }) {
    super({
      apiKey: config.secretKey,
      baseUrl: "https://api.stripe.com/v1"
    })
    
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2023-10-16"
    })
  }
  
  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.startsWith("sk_")
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.balance.retrieve()
      return true
    } catch {
      return false
    }
  }
  
  async createPaymentIntent(data: {
    amount: number
    currency: string
    customer?: string
    metadata?: Record<string, string>
  }) {
    return await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      customer: data.customer,
      metadata: data.metadata,
      automatic_payment_methods: { enabled: true }
    })
  }
  
  async confirmPayment(paymentIntentId: string) {
    return await this.stripe.paymentIntents.confirm(paymentIntentId)
  }
  
  async createRefund(chargeId: string, amount?: number) {
    return await this.stripe.refunds.create({
      charge: chargeId,
      amount
    })
  }
  
  async handleWebhook(payload: string, signature: string) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentSuccess(event.data.object)
        break
      case "payment_intent.payment_failed":
        await this.handlePaymentFailure(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }
  
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.order_id
    if (orderId) {
      const orderService = container.resolve("orderService")
      await orderService.updateOrder(orderId, { payment_status: "captured" })
    }
  }
  
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.order_id
    if (orderId) {
      const orderService = container.resolve("orderService")
      await orderService.updateOrder(orderId, { payment_status: "failed" })
    }
  }
}
```

### PayPal Integration
```typescript
// src/services/paypal-payment.ts
class PayPalPaymentService extends ExternalIntegrationService {
  private clientId: string
  private clientSecret: string
  
  constructor(config: {
    clientId: string
    clientSecret: string
    environment: "sandbox" | "live"
  }) {
    const baseUrl = config.environment === "sandbox"
      ? "https://api.sandbox.paypal.com"
      : "https://api.paypal.com"
    
    super({ apiKey: "", baseUrl })
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
  }
  
  validateConfig(): boolean {
    return !!this.clientId && !!this.clientSecret
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken()
      return true
    } catch {
      return false
    }
  }
  
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    })
    
    const data = await response.json()
    return data.access_token
  }
  
  async createOrder(orderData: {
    amount: string
    currency: string
    reference_id: string
  }) {
    const accessToken = await this.getAccessToken()
    
    return await this.makeRequest("/v2/checkout/orders", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}` },
      data: {
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: orderData.reference_id,
          amount: {
            currency_code: orderData.currency,
            value: orderData.amount
          }
        }]
      }
    })
  }
  
  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken()
    
    return await this.makeRequest(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
  }
}
```

## Shipping Provider Integration

### Shippo Integration
```typescript
// src/services/shippo-shipping.ts
class ShippoShippingService extends ExternalIntegrationService {
  constructor(apiKey: string) {
    super({
      apiKey,
      baseUrl: "https://api.goshippo.com"
    })
  }
  
  validateConfig(): boolean {
    return !!this.apiKey && this.apiKey.startsWith("shippo_")
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest("/", { 
        headers: { "Authorization": `ShippoToken ${this.apiKey}` }
      })
      return true
    } catch {
      return false
    }
  }
  
  async createShipment(data: {
    from_address: Address
    to_address: Address
    parcels: Parcel[]
    async?: boolean
  }) {
    return await this.makeRequest("/shipments/", {
      method: "POST",
      headers: { "Authorization": `ShippoToken ${this.apiKey}` },
      data
    })
  }
  
  async getRates(shipmentId: string) {
    return await this.makeRequest(`/shipments/${shipmentId}/rates/`, {
      headers: { "Authorization": `ShippoToken ${this.apiKey}` }
    })
  }
  
  async createLabel(rateId: string) {
    return await this.makeRequest("/transactions/", {
      method: "POST",
      headers: { "Authorization": `ShippoToken ${this.apiKey}` },
      data: {
        rate: rateId,
        label_file_type: "PDF"
      }
    })
  }
  
  async trackShipment(carrier: string, trackingNumber: string) {
    return await this.makeRequest(`/tracks/${carrier}/${trackingNumber}/`, {
      headers: { "Authorization": `ShippoToken ${this.apiKey}` }
    })
  }
}

interface Address {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
}

interface Parcel {
  length: string
  width: string
  height: string
  distance_unit: "in" | "cm"
  weight: string
  mass_unit: "lb" | "kg"
}
```

## Inventory Management Integration

### Inventory Service Integration
```typescript
// src/services/inventory-sync.ts
class InventoryManagementService extends ExternalIntegrationService {
  constructor(config: {
    apiKey: string
    baseUrl: string
    storeId: string
  }) {
    super(config)
    this.storeId = config.storeId
  }
  
  private storeId: string
  
  validateConfig(): boolean {
    return !!this.apiKey && !!this.storeId
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest(`/stores/${this.storeId}/health`)
      return true
    } catch {
      return false
    }
  }
  
  async syncInventory(variants: Array<{
    sku: string
    quantity: number
    location_id?: string
  }>) {
    const batchSize = 50
    const results = []
    
    for (let i = 0; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize)
      
      const result = await this.makeRequest(`/stores/${this.storeId}/inventory/sync`, {
        method: "POST",
        data: { variants: batch }
      })
      
      results.push(...result.updated_variants)
    }
    
    return results
  }
  
  async getInventoryLevels(skus: string[]) {
    return await this.makeRequest(`/stores/${this.storeId}/inventory`, {
      method: "POST",
      data: { skus }
    })
  }
  
  async reserveInventory(items: Array<{
    sku: string
    quantity: number
    reservation_id: string
  }>) {
    return await this.makeRequest(`/stores/${this.storeId}/inventory/reserve`, {
      method: "POST",
      data: { items }
    })
  }
  
  async releaseReservation(reservationId: string) {
    return await this.makeRequest(`/stores/${this.storeId}/inventory/release/${reservationId}`, {
      method: "DELETE"
    })
  }
}
```

## Email Service Integration

### SendGrid Integration
```typescript
// src/services/sendgrid-email.ts
import sgMail from "@sendgrid/mail"

class SendGridEmailService {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey)
  }
  
  async sendTransactionalEmail(data: {
    to: string
    template_id: string
    dynamic_template_data: Record<string, any>
    from?: string
  }) {
    const msg = {
      to: data.to,
      from: data.from || process.env.DEFAULT_FROM_EMAIL,
      templateId: data.template_id,
      dynamicTemplateData: data.dynamic_template_data
    }
    
    try {
      await sgMail.send(msg)
      return { success: true }
    } catch (error) {
      console.error("SendGrid error:", error)
      throw error
    }
  }
  
  async sendOrderConfirmation(order: any, customerEmail: string) {
    return await this.sendTransactionalEmail({
      to: customerEmail,
      template_id: process.env.SENDGRID_ORDER_CONFIRMATION_TEMPLATE!,
      dynamic_template_data: {
        order_number: order.display_id,
        total: order.total / 100, // Convert cents to dollars
        items: order.items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.unit_price / 100
        })),
        shipping_address: order.shipping_address
      }
    })
  }
  
  async sendShippingNotification(order: any, trackingNumber: string) {
    return await this.sendTransactionalEmail({
      to: order.email,
      template_id: process.env.SENDGRID_SHIPPING_TEMPLATE!,
      dynamic_template_data: {
        order_number: order.display_id,
        tracking_number: trackingNumber,
        carrier: order.shipping_methods[0]?.shipping_option?.name
      }
    })
  }
}
```

## Webhook Handler Patterns

### Generic Webhook Handler
```typescript
// src/api/webhooks/[provider]/route.ts
import crypto from "crypto"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { provider } = req.params
  const signature = req.headers["x-webhook-signature"] as string
  const payload = req.body
  
  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature, provider)) {
    return res.status(401).json({ error: "Invalid signature" })
  }
  
  const webhookService = req.scope.resolve("webhookService")
  
  try {
    await webhookService.processWebhook(provider, payload)
    res.status(200).json({ received: true })
  } catch (error) {
    console.error(`Webhook processing error for ${provider}:`, error)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

function verifyWebhookSignature(
  payload: any,
  signature: string,
  provider: string
): boolean {
  const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`]
  
  if (!secret) {
    console.error(`No webhook secret found for provider: ${provider}`)
    return false
  }
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex")
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### Webhook Processing Service
```typescript
// src/services/webhook.ts
class WebhookService {
  constructor(
    private eventBusService: any,
    private stripeService: StripePaymentService,
    private shippoService: ShippoShippingService
  ) {}
  
  async processWebhook(provider: string, payload: any) {
    switch (provider) {
      case "stripe":
        await this.handleStripeWebhook(payload)
        break
      case "shippo":
        await this.handleShippoWebhook(payload)
        break
      case "inventory":
        await this.handleInventoryWebhook(payload)
        break
      default:
        throw new Error(`Unsupported webhook provider: ${provider}`)
    }
  }
  
  private async handleStripeWebhook(payload: any) {
    switch (payload.type) {
      case "payment_intent.succeeded":
        await this.eventBusService.emit("payment.captured", {
          payment_id: payload.data.object.id,
          order_id: payload.data.object.metadata.order_id
        })
        break
      case "payment_intent.payment_failed":
        await this.eventBusService.emit("payment.failed", {
          payment_id: payload.data.object.id,
          order_id: payload.data.object.metadata.order_id,
          failure_reason: payload.data.object.last_payment_error?.message
        })
        break
    }
  }
  
  private async handleShippoWebhook(payload: any) {
    if (payload.event === "track_updated") {
      await this.eventBusService.emit("shipment.updated", {
        tracking_number: payload.data.tracking_number,
        status: payload.data.tracking_status,
        carrier: payload.data.carrier
      })
    }
  }
  
  private async handleInventoryWebhook(payload: any) {
    if (payload.event === "inventory.updated") {
      await this.eventBusService.emit("inventory.level_changed", {
        sku: payload.data.sku,
        quantity: payload.data.available_quantity,
        location: payload.data.location_id
      })
    }
  }
}
```

## Configuration Management

### Integration Configuration
```typescript
// src/config/integrations.ts
export interface IntegrationConfig {
  enabled: boolean
  provider: string
  credentials: Record<string, string>
  settings: Record<string, any>
}

export const integrationConfigs: Record<string, IntegrationConfig> = {
  payment_stripe: {
    enabled: process.env.STRIPE_ENABLED === "true",
    provider: "stripe",
    credentials: {
      secret_key: process.env.STRIPE_SECRET_KEY!,
      publishable_key: process.env.STRIPE_PUBLISHABLE_KEY!,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!
    },
    settings: {
      capture_method: "automatic",
      payment_methods: ["card", "apple_pay", "google_pay"]
    }
  },
  shipping_shippo: {
    enabled: process.env.SHIPPO_ENABLED === "true",
    provider: "shippo",
    credentials: {
      api_key: process.env.SHIPPO_API_KEY!
    },
    settings: {
      default_currency: "USD",
      async_shipments: true,
      carriers: ["usps", "ups", "fedex"]
    }
  },
  email_sendgrid: {
    enabled: process.env.SENDGRID_ENABLED === "true",
    provider: "sendgrid",
    credentials: {
      api_key: process.env.SENDGRID_API_KEY!
    },
    settings: {
      templates: {
        order_confirmation: process.env.SENDGRID_ORDER_TEMPLATE!,
        shipping_notification: process.env.SENDGRID_SHIPPING_TEMPLATE!,
        password_reset: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE!
      }
    }
  }
}
```

## Testing Integration Services

### Integration Tests
```typescript
// __tests__/integrations/stripe.test.ts
describe("Stripe Integration", () => {
  let stripeService: StripePaymentService
  
  beforeEach(() => {
    stripeService = new StripePaymentService({
      secretKey: "sk_test_...",
      webhookSecret: "whsec_test_..."
    })
  })
  
  describe("createPaymentIntent", () => {
    it("should create payment intent successfully", async () => {
      const paymentIntent = await stripeService.createPaymentIntent({
        amount: 2000,
        currency: "usd",
        metadata: { order_id: "order_123" }
      })
      
      expect(paymentIntent.id).toMatch(/^pi_/)
      expect(paymentIntent.amount).toBe(2000)
      expect(paymentIntent.currency).toBe("usd")
    })
  })
  
  describe("webhook handling", () => {
    it("should process payment success webhook", async () => {
      const payload = {
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            metadata: { order_id: "order_123" }
          }
        }
      }
      
      const spy = jest.spyOn(eventBusService, "emit")
      
      await stripeService.handleWebhook(
        JSON.stringify(payload),
        "valid_signature"
      )
      
      expect(spy).toHaveBeenCalledWith("payment.captured", {
        payment_id: "pi_test_123",
        order_id: "order_123"
      })
    })
  })
})
```