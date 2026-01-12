/**
 * Complete Module Template
 *
 * This template shows a complete custom module structure with:
 * - Multiple data models with various property types
 * - One-to-many and many-to-many relationships
 * - Main service extending MedusaService
 * - Additional custom service
 * - Module configuration and exports
 *
 * Usage: Copy and adapt this structure for your custom module
 * Location: src/modules/[module-name]/
 */

// ============================================================================
// DATA MODELS
// ============================================================================

// src/modules/[module-name]/models/main-entity.ts
import { model } from "@medusajs/framework/utils"
import { RelatedEntity } from "./related-entity"
import { Tag } from "./tag"

export enum EntityStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived"
}

const MainEntity = model.define("main_entity", {
  // Primary Key
  id: model.id().primaryKey(),

  // Basic Properties
  name: model.text(),
  handle: model.text().unique(),
  description: model.text().nullable(),

  // Numeric Properties
  order: model.number().default(0),
  price: model.bigNumber(),

  // Boolean Properties
  is_active: model.boolean().default(true),

  // Enum Property
  status: model.enum(EntityStatus).default(EntityStatus.ACTIVE),

  // JSON Property
  metadata: model.json().nullable(),

  // Date Properties
  published_at: model.dateTime().nullable(),

  // Indexes
  search_terms: model.text().nullable().searchable(),

  // One-to-Many Relationship (this entity has many related entities)
  related_entities: model.hasMany(() => RelatedEntity, {
    mappedBy: "main_entity"
  }),

  // Many-to-Many Relationship (this entity has many tags, tags have many entities)
  tags: model.manyToMany(() => Tag, {
    mappedBy: "main_entities",
    pivotTable: "main_entity_tag",
    joinColumn: "main_entity_id",
    inverseJoinColumn: "tag_id"
  })
})

export default MainEntity

// ----------------------------------------------------------------------------

// src/modules/[module-name]/models/related-entity.ts
import { model } from "@medusajs/framework/utils"
import { MainEntity } from "./main-entity"

const RelatedEntity = model.define("related_entity", {
  id: model.id().primaryKey(),

  title: model.text(),
  content: model.text().nullable(),

  // Foreign key will be auto-generated as main_entity_id
  main_entity: model.belongsTo(() => MainEntity, {
    mappedBy: "related_entities"
  })
})

export default RelatedEntity

// ----------------------------------------------------------------------------

// src/modules/[module-name]/models/tag.ts
import { model } from "@medusajs/framework/utils"
import { MainEntity } from "./main-entity"

const Tag = model.define("tag", {
  id: model.id().primaryKey(),

  name: model.text(),
  slug: model.text().unique(),

  // Many-to-Many (tags have many main entities)
  main_entities: model.manyToMany(() => MainEntity, {
    mappedBy: "tags"
  })
})

export default Tag

// ============================================================================
// SERVICES
// ============================================================================

// src/modules/[module-name]/services/custom-service.ts
export class CustomService {
  private apiClient: any

  constructor({ logger }: { logger: any }) {
    // Initialize custom service
    this.apiClient = null // Initialize your API client, etc.
  }

  async performCustomOperation(data: any): Promise<any> {
    // Custom business logic
    return {
      success: true,
      data
    }
  }
}

// ----------------------------------------------------------------------------

// src/modules/[module-name]/services/index.ts
export * from "./custom-service"

// ----------------------------------------------------------------------------

// src/modules/[module-name]/service.ts
import { MedusaService } from "@medusajs/framework/utils"
import MainEntity from "./models/main-entity"
import RelatedEntity from "./models/related-entity"
import Tag from "./models/tag"
import { CustomService } from "./services"

type InjectedDependencies = {
  customService: CustomService
}

class ModuleService extends MedusaService({
  MainEntity,
  RelatedEntity,
  Tag
}) {
  private customService: CustomService

  constructor(
    { customService }: InjectedDependencies,
    ...args: any[]
  ) {
    super(...args)
    this.customService = customService
  }

  // Custom method example
  async getActiveMainEntities() {
    return await this.listMainEntities({
      is_active: true
    })
  }

  // Custom method using injected service
  async processEntityWithCustomLogic(entityId: string, data: any) {
    const entity = await this.retrieveMainEntity(entityId)

    const result = await this.customService.performCustomOperation({
      entity,
      data
    })

    return result
  }
}

export default ModuleService

// ============================================================================
// MODULE CONFIGURATION
// ============================================================================

// src/modules/[module-name]/index.ts
import ModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const MODULE_NAME = "moduleService"

export default Module(MODULE_NAME, {
  service: ModuleService
})

// ============================================================================
// REGISTRATION IN medusa-config.ts
// ============================================================================

/*
Add to medusa-config.ts:

import { defineConfig } from "@medusajs/framework/utils"

module.exports = defineConfig({
  // ... other config
  modules: [
    {
      resolve: "./src/modules/[module-name]"
    }
  ]
})
*/

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// In an API route or workflow step:
import { MODULE_NAME } from "../modules/[module-name]"
import ModuleService from "../modules/[module-name]/service"

// Resolve the service
const moduleService: ModuleService = req.scope.resolve(MODULE_NAME)

// Create a main entity with related entities
const mainEntity = await moduleService.createMainEntities({
  name: "Example Entity",
  handle: "example-entity",
  description: "An example entity",
  status: "active",
  metadata: {
    custom_field: "value"
  }
})

// Create related entity
const relatedEntity = await moduleService.createRelatedEntities({
  title: "Related Item",
  content: "Some content",
  main_entity_id: mainEntity.id
})

// List with filters
const entities = await moduleService.listMainEntities({
  is_active: true
}, {
  relations: ["related_entities", "tags"]
})

// Update
await moduleService.updateMainEntities({
  id: mainEntity.id,
  is_active: false
})

// Delete
await moduleService.deleteMainEntities(mainEntity.id)
*/
