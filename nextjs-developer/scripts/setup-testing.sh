#!/bin/bash

# Testing Setup Script for Next.js
# Sets up Jest and React Testing Library for a Next.js project
# Usage: ./scripts/setup-testing.sh [--playwright]

set -e

SETUP_PLAYWRIGHT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --playwright|-p)
            SETUP_PLAYWRIGHT=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/setup-testing.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --playwright, -p    Also set up Playwright for E2E testing"
            echo "  --help, -h          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "Setting up testing for Next.js..."
echo ""

# Install Jest and React Testing Library
echo "Step 1: Installing Jest and React Testing Library..."
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest

echo ""
echo "Step 2: Creating Jest configuration..."

# Create jest.config.js
cat > jest.config.js << 'EOF'
const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!jest.config.js",
    "!next.config.js",
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
EOF

echo "Created: jest.config.js"

# Create jest.setup.js
cat > jest.setup.js << 'EOF'
import "@testing-library/jest-dom"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))
EOF

echo "Created: jest.setup.js"

# Add test script to package.json if not exists
echo ""
echo "Step 3: Updating package.json scripts..."

# Check if jq is available
if command -v jq &> /dev/null; then
    # Add scripts using jq
    jq '.scripts.test = "jest" | .scripts["test:watch"] = "jest --watch" | .scripts["test:coverage"] = "jest --coverage"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo "Added test scripts to package.json"
else
    echo "Note: jq not found. Please add these scripts to package.json manually:"
    echo '  "test": "jest"'
    echo '  "test:watch": "jest --watch"'
    echo '  "test:coverage": "jest --coverage"'
fi

# Create example test file
echo ""
echo "Step 4: Creating example test file..."

mkdir -p __tests__

cat > __tests__/example.test.tsx << 'EOF'
import { render, screen } from "@testing-library/react"

// Example component for testing
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>
}

describe("Example Test Suite", () => {
  it("renders a greeting", () => {
    render(<Greeting name="World" />)

    expect(screen.getByRole("heading")).toHaveTextContent("Hello, World!")
  })
})
EOF

echo "Created: __tests__/example.test.tsx"

# Set up Playwright if requested
if [ "$SETUP_PLAYWRIGHT" = true ]; then
    echo ""
    echo "Step 5: Setting up Playwright for E2E testing..."

    npm install --save-dev @playwright/test

    # Create playwright.config.ts
    cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
})
EOF

    echo "Created: playwright.config.ts"

    # Create e2e directory and example test
    mkdir -p e2e

    cat > e2e/example.spec.ts << 'EOF'
import { test, expect } from "@playwright/test"

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto("/")

    // Update this to match your actual page title
    await expect(page).toHaveTitle(/Next/)
  })

  test("navigates correctly", async ({ page }) => {
    await page.goto("/")

    // Add your navigation tests here
  })
})
EOF

    echo "Created: e2e/example.spec.ts"

    # Install Playwright browsers
    echo ""
    echo "Installing Playwright browsers..."
    npx playwright install

    if command -v jq &> /dev/null; then
        jq '.scripts["test:e2e"] = "playwright test" | .scripts["test:e2e:ui"] = "playwright test --ui"' package.json > package.json.tmp && mv package.json.tmp package.json
        echo "Added E2E test scripts to package.json"
    else
        echo "Note: Add these scripts to package.json:"
        echo '  "test:e2e": "playwright test"'
        echo '  "test:e2e:ui": "playwright test --ui"'
    fi
fi

echo ""
echo "Testing setup complete!"
echo ""
echo "Available commands:"
echo "  npm test              - Run all tests"
echo "  npm run test:watch    - Run tests in watch mode"
echo "  npm run test:coverage - Run tests with coverage"
if [ "$SETUP_PLAYWRIGHT" = true ]; then
    echo "  npm run test:e2e      - Run E2E tests"
    echo "  npm run test:e2e:ui   - Run E2E tests with UI"
fi
echo ""
echo "Get started by running: npm test"
