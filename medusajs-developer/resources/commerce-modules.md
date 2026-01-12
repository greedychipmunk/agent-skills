# MedusaJS Commerce Modules Reference

## Core Commerce Modules

### API Key Module
Manages API keys for external integrations and authentication.

```typescript
// Usage example
const apiKeyService = container.resolve("apiKeyService")

// Create API key
const apiKey = await apiKeyService.createApiKey({
  title: "Payment Gateway Integration",
  type: "secret", // or "publishable"
  created_by: userId
})

// Validate API key
const isValid = await apiKeyService.validateApiKey(token)
```

### Auth Module
Handles authentication and authorization for admin and customer users.

```typescript
// Admin authentication
const authService = container.resolve("authService")

// Create auth user
const authUser = await authService.createAuthUser({
  provider_id: "emailpass",
  user_metadata: { email: "admin@example.com" }
})

// Authenticate
const session = await authService.authenticate({
  provider_id: "emailpass",
  provider_metadata: {
    email: "admin@example.com",
    password: "password"
  }
})
```

### Cart Module
Manages shopping cart functionality including items, promotions, and calculations.

```typescript
const cartService = container.resolve("cartService")

// Create cart
const cart = await cartService.createCart({
  currency_code: "usd",
  region_id: "reg_01"
})

// Add line item
await cartService.addLineItem(cart.id, {
  variant_id: "variant_01",
  quantity: 2
})

// Apply promotion
await cartService.addPromotions(cart.id, ["promo_01"])

// Calculate totals
const calculatedCart = await cartService.calculateTotals(cart.id)
```

### Customer Module
Manages customer accounts, profiles, and customer groups.

```typescript
const customerService = container.resolve("customerService")

// Create customer
const customer = await customerService.createCustomer({
  email: "customer@example.com",
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890"
})

// Add to customer group
await customerService.addCustomerToGroup(customer.id, "vip_customers")

// Create address
await customerService.createCustomerAddress(customer.id, {
  first_name: "John",
  last_name: "Doe",
  address_1: "123 Main St",
  city: "New York",
  country_code: "US",
  postal_code: "10001"
})
```

### Order Module
Handles order creation, management, and fulfillment processes.

```typescript
const orderService = container.resolve("orderService")

// Create order from cart
const order = await orderService.createFromCart(cart.id)

// Update order status
await orderService.updateOrder(order.id, {
  status: "processing"
})

// Create fulfillment
await orderService.createFulfillment(order.id, {
  items: [
    {
      id: lineItemId,
      quantity: 1
    }
  ],
  shipping_option_id: "so_01"
})

// Cancel order
await orderService.cancelOrder(order.id, {
  reason: "customer_request"
})
```

### Payment Module
Manages payment processing, refunds, and payment provider integrations.

```typescript
const paymentService = container.resolve("paymentService")

// Create payment collection
const paymentCollection = await paymentService.createPaymentCollection({
  currency_code: "usd",
  amount: 10000, // $100.00 in cents
  region_id: "reg_01"
})

// Create payment session
const paymentSession = await paymentService.createPaymentSession({
  payment_collection_id: paymentCollection.id,
  provider_id: "stripe",
  amount: 10000,
  currency_code: "usd"
})

// Capture payment
await paymentService.capturePayment({
  payment_id: payment.id,
  amount: 10000
})
```

### Product Module
Manages product catalog including variants, options, and inventory.

```typescript
const productService = container.resolve("productService")

// Create product
const product = await productService.createProduct({
  title: "Sample T-Shirt",
  subtitle: "Comfortable cotton t-shirt",
  description: "High-quality cotton t-shirt in multiple colors",
  handle: "sample-t-shirt",
  status: "published",
  thumbnail: "https://example.com/image.jpg",
  categories: [{ id: "cat_clothing" }],
  tags: [{ value: "clothing" }, { value: "cotton" }]
})

// Create product variant
await productService.createProductVariant(product.id, {
  title: "Small / Red",
  sku: "TSHIRT-SM-RED",
  barcode: "1234567890",
  options: [
    { option_id: "size_option", value: "Small" },
    { option_id: "color_option", value: "Red" }
  ],
  prices: [
    {
      currency_code: "usd",
      amount: 2500 // $25.00
    }
  ]
})

// Update inventory
await productService.updateInventory(variant.id, {
  quantity: 100,
  allow_backorder: false
})
```

### Pricing Module
Handles dynamic pricing, price lists, and currency management.

```typescript
const pricingService = container.resolve("pricingService")

// Create price list
const priceList = await pricingService.createPriceList({
  name: "VIP Customer Pricing",
  description: "Special pricing for VIP customers",
  type: "sale",
  status: "active",
  starts_at: new Date(),
  ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  customer_groups: [{ id: "vip_customers" }]
})

// Add prices to list
await pricingService.addPriceListPrices(priceList.id, [
  {
    variant_id: "variant_01",
    currency_code: "usd",
    amount: 2250, // $22.50 (10% discount)
    min_quantity: 1
  }
])

// Calculate pricing context
const pricing = await pricingService.calculatePrices({
  variant_ids: ["variant_01"],
  currency_code: "usd",
  customer_id: "customer_01",
  region_id: "reg_01"
})
```

### Promotion Module
Manages discount codes, promotions, and marketing campaigns.

```typescript
const promotionService = container.resolve("promotionService")

// Create promotion
const promotion = await promotionService.createPromotion({
  code: "SUMMER2024",
  type: "standard",
  is_automatic: false,
  starts_at: new Date(),
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  usage_limit: 100,
  rules: [
    {
      type: "rules.spend",
      operator: "gte",
      values: [{ value: 5000 }] // Minimum $50 spend
    }
  ],
  actions: [
    {
      type: "actions.percentage",
      value: 20 // 20% discount
    }
  ]
})

// Apply promotion to cart
await promotionService.addPromotionsToCart(cart.id, [promotion.code])

// Check promotion eligibility
const eligibility = await promotionService.checkPromotion({
  promotion_code: "SUMMER2024",
  cart_id: cart.id
})
```

### Tax Module
Handles tax calculations, tax rates, and tax provider integrations.

```typescript
const taxService = container.resolve("taxService")

// Create tax rate
const taxRate = await taxService.createTaxRate({
  name: "Sales Tax",
  code: "SALES_TAX_NY",
  rate: 8.25, // 8.25%
  region_id: "reg_ny",
  tax_region_id: "tax_reg_ny"
})

// Calculate tax for cart
const taxLines = await taxService.calculateTax({
  cart_id: cart.id,
  shipping_address: {
    country_code: "US",
    province: "NY",
    postal_code: "10001"
  }
})

// Create tax region
const taxRegion = await taxService.createTaxRegion({
  country_code: "US",
  province_code: "NY",
  parent_id: "tax_reg_us",
  metadata: { state_name: "New York" }
})
```

## Module Integration Patterns

### Cross-Module Communication
```typescript
// Using events for loose coupling
export default async function orderCreatedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve("orderService")
  const inventoryService = container.resolve("inventoryService")
  const customerService = container.resolve("customerService")
  
  const order = await orderService.retrieveOrder(event.data.id, {
    relations: ["items", "customer"]
  })
  
  // Update inventory
  for (const item of order.items) {
    await inventoryService.adjustInventory(item.variant_id, -item.quantity)
  }
  
  // Update customer stats
  await customerService.updateCustomerStats(order.customer_id, {
    total_spent: order.total,
    order_count: 1
  })
}
```

### Service Composition
```typescript
// Composite service using multiple modules
class CheckoutService {
  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private customerService: CustomerService,
    private promotionService: PromotionService,
    private taxService: TaxService
  ) {}
  
  async processCheckout(cartId: string, checkoutData: CheckoutData) {
    // 1. Validate cart and apply promotions
    const cart = await this.cartService.retrieveCart(cartId)
    await this.promotionService.validatePromotions(cart.id)
    
    // 2. Calculate final totals including tax
    const taxLines = await this.taxService.calculateTax({
      cart_id: cart.id,
      shipping_address: checkoutData.shipping_address
    })
    
    // 3. Create payment collection
    const paymentCollection = await this.paymentService.createPaymentCollection({
      currency_code: cart.currency_code,
      amount: cart.total + taxLines.total,
      region_id: cart.region_id
    })
    
    // 4. Process payment
    const payment = await this.paymentService.processPayment({
      payment_collection_id: paymentCollection.id,
      payment_method: checkoutData.payment_method
    })
    
    // 5. Create order
    const order = await this.orderService.createFromCart(cart.id, {
      payment_collection_id: paymentCollection.id
    })
    
    // 6. Update customer profile
    if (checkoutData.customer_id) {
      await this.customerService.updateLastOrder(
        checkoutData.customer_id,
        order.id
      )
    }
    
    return order
  }
}
```

### Custom Module Extensions
```typescript
// Extending commerce modules with custom fields
const ExtendedProduct = model.define("product", {
  // Extend product model
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  custom_attributes: model.json().nullable(),
  supplier_info: model.json().nullable(),
  environmental_rating: model.enum(["A", "B", "C", "D", "F"]).nullable()
})

// Custom service extending ProductService
class ExtendedProductService extends ProductService {
  async updateSEOInfo(productId: string, seoData: {
    seo_title?: string
    seo_description?: string
  }) {
    return await this.productRepository.update(productId, seoData)
  }
  
  async getProductsBySustainabilityRating(rating: string) {
    return await this.productRepository.find({
      where: { environmental_rating: rating }
    })
  }
}
```