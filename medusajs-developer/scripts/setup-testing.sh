#!/bin/bash

# Testing Setup Script for MedusaJS
# Installs and configures Jest and Medusa testing tools
# Usage: ./scripts/setup-testing.sh

set -e

echo "Setting up testing environment for MedusaJS..."

# Install testing dependencies
echo "1. Installing testing dependencies..."
npm install --save-dev @medusajs/test-utils@latest jest @types/jest @swc/jest

# Create jest.config.js
echo "2. Creating jest.config.js..."
cat > jest.config.js << 'EOF'
const { loadEnv } = require("@medusajs/framework/utils")
loadEnv("test", process.cwd())

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
          target: "es2021",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/"],
  setupFiles: ["./integration-tests/setup.js"],
}

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"]
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"]
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"]
}
EOF

# Create integration-tests directory and setup file
echo "3. Creating integration-tests directory..."
mkdir -p integration-tests/http

cat > integration-tests/setup.js << 'EOF'
const { MetadataStorage } = require("@medusajs/framework/mikro-orm/core")

MetadataStorage.clear()
EOF

# Add test scripts to package.json if they don't exist
echo "4. Adding test scripts to package.json..."
echo ""
echo "Add the following scripts to your package.json:"
echo ""
echo '"scripts": {'
echo '  "test:integration:http": "TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules jest --silent=false --runInBand --forceExit",'
echo '  "test:integration:modules": "TEST_TYPE=integration:modules NODE_OPTIONS=--experimental-vm-modules jest --silent=false --runInBand --forceExit",'
echo '  "test:unit": "TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules jest --silent --runInBand --forceExit"'
echo '}'
echo ""

echo "Testing setup completed!"
echo "You can now create tests in:"
echo "  - integration-tests/http/ for API route tests"
echo "  - src/modules/<module-name>/__tests__/ for module tests"
echo "  - src/**/__tests__/ for unit tests"
