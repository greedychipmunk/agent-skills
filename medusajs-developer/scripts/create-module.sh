#!/bin/bash

# Create Module Script for MedusaJS
# Creates the basic structure for a new custom module
# Usage: ./scripts/create-module.sh <module-name>

set -e

if [ $# -eq 0 ]; then
    echo "Error: Module name required"
    echo "Usage: ./scripts/create-module.sh <module-name>"
    echo "Example: ./scripts/create-module.sh blog"
    exit 1
fi

MODULE_NAME=$1
MODULE_DIR="src/modules/$MODULE_NAME"

# Check if module already exists
if [ -d "$MODULE_DIR" ]; then
    echo "Error: Module '$MODULE_NAME' already exists at $MODULE_DIR"
    exit 1
fi

echo "Creating module: $MODULE_NAME"

# Create directory structure
mkdir -p "$MODULE_DIR/models"
mkdir -p "$MODULE_DIR/__tests__"

# Create index.ts
cat > "$MODULE_DIR/index.ts" << EOF
import { Module } from "@medusajs/framework/utils"
import ${MODULE_NAME^}ModuleService from "./service"

export const ${MODULE_NAME^^}_MODULE = "${MODULE_NAME}"

export default Module(${MODULE_NAME^^}_MODULE, {
  service: ${MODULE_NAME^}ModuleService,
})
EOF

# Create service.ts
cat > "$MODULE_DIR/service.ts" << EOF
import { MedusaService } from "@medusajs/framework/utils"

class ${MODULE_NAME^}ModuleService extends MedusaService({
  // Add models here
  // Example: Post,
}) {
  // Add custom methods here
}

export default ${MODULE_NAME^}ModuleService
EOF

# Create a sample model file
cat > "$MODULE_DIR/models/.gitkeep" << EOF
# Add your data models here
# Example: post.ts, author.ts, etc.
EOF

echo ""
echo "Module '$MODULE_NAME' created successfully!"
echo "Location: $MODULE_DIR"
echo ""
echo "Next steps:"
echo "1. Create data models in $MODULE_DIR/models/"
echo "2. Update service.ts to include your models"
echo "3. Generate migrations: ./scripts/generate-migration.sh $MODULE_NAME"
echo "4. Run migrations: ./scripts/run-migrations.sh"
