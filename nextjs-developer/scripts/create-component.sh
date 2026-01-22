#!/bin/bash

# Create Component Script for Next.js
# Creates a new React component with optional test file
# Usage: ./scripts/create-component.sh <component-name> [--client] [--test] [--dir DIR]

set -e

if [ $# -eq 0 ]; then
    echo "Error: Component name required"
    echo "Usage: ./scripts/create-component.sh <component-name> [OPTIONS]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/create-component.sh Button"
    echo "  ./scripts/create-component.sh UserCard --client --test"
    echo "  ./scripts/create-component.sh Header --dir app/components"
    exit 1
fi

COMPONENT_NAME=$1
shift

IS_CLIENT=false
CREATE_TEST=false
COMPONENT_DIR="components"

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --client|-c)
            IS_CLIENT=true
            shift
            ;;
        --test|-t)
            CREATE_TEST=true
            shift
            ;;
        --dir|-d)
            COMPONENT_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./scripts/create-component.sh <component-name> [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --client, -c     Create as Client Component with 'use client'"
            echo "  --test, -t       Create a test file"
            echo "  --dir, -d DIR    Directory to create component in (default: components)"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Convert component name to PascalCase
PASCAL_CASE=$(echo "$COMPONENT_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')

# Convert to kebab-case for filename
KEBAB_CASE=$(echo "$COMPONENT_NAME" | sed -r 's/([A-Z])/-\L\1/g' | sed 's/^-//')

FULL_DIR="$COMPONENT_DIR"
COMPONENT_FILE="$FULL_DIR/$KEBAB_CASE.tsx"

# Check if component already exists
if [ -f "$COMPONENT_FILE" ]; then
    echo "Error: Component already exists at $COMPONENT_FILE"
    exit 1
fi

# Create directory
mkdir -p "$FULL_DIR"

# Create component file
if [ "$IS_CLIENT" = true ]; then
    cat > "$COMPONENT_FILE" << EOF
"use client"

import { useState } from "react"

interface ${PASCAL_CASE}Props {
  className?: string
  children?: React.ReactNode
}

export function ${PASCAL_CASE}({ className, children }: ${PASCAL_CASE}Props) {
  const [state, setState] = useState<string>("")

  return (
    <div className={className}>
      {children}
    </div>
  )
}
EOF
else
    cat > "$COMPONENT_FILE" << EOF
interface ${PASCAL_CASE}Props {
  className?: string
  children?: React.ReactNode
}

export function ${PASCAL_CASE}({ className, children }: ${PASCAL_CASE}Props) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
EOF
fi

echo "Created: $COMPONENT_FILE"

# Create test file if requested
if [ "$CREATE_TEST" = true ]; then
    TEST_FILE="$FULL_DIR/$KEBAB_CASE.test.tsx"

    if [ "$IS_CLIENT" = true ]; then
        cat > "$TEST_FILE" << EOF
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ${PASCAL_CASE} } from "./$KEBAB_CASE"

describe("${PASCAL_CASE}", () => {
  it("renders children", () => {
    render(<${PASCAL_CASE}>Hello</${PASCAL_CASE}>)

    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("applies className", () => {
    render(<${PASCAL_CASE} className="custom-class">Content</${PASCAL_CASE}>)

    expect(screen.getByText("Content").parentElement).toHaveClass("custom-class")
  })

  // Add more tests for interactive behavior
})
EOF
    else
        cat > "$TEST_FILE" << EOF
import { render, screen } from "@testing-library/react"
import { ${PASCAL_CASE} } from "./$KEBAB_CASE"

describe("${PASCAL_CASE}", () => {
  it("renders children", () => {
    render(<${PASCAL_CASE}>Hello</${PASCAL_CASE}>)

    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("applies className", () => {
    render(<${PASCAL_CASE} className="custom-class">Content</${PASCAL_CASE}>)

    expect(screen.getByText("Content").parentElement).toHaveClass("custom-class")
  })
})
EOF
    fi

    echo "Created: $TEST_FILE"
fi

echo ""
echo "Component '${PASCAL_CASE}' created successfully!"
echo ""
echo "Import with:"
echo "  import { ${PASCAL_CASE} } from \"@/$COMPONENT_DIR/$KEBAB_CASE\""
