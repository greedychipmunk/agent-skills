#!/bin/bash

# Create Page Script for Next.js App Router
# Creates a new page with optional layout, loading, and error files
# Usage: ./scripts/create-page.sh <page-path> [--layout] [--loading] [--error]

set -e

if [ $# -eq 0 ]; then
    echo "Error: Page path required"
    echo "Usage: ./scripts/create-page.sh <page-path> [OPTIONS]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/create-page.sh about"
    echo "  ./scripts/create-page.sh dashboard --layout --loading"
    echo "  ./scripts/create-page.sh blog/[slug] --loading --error"
    exit 1
fi

PAGE_PATH=$1
shift

CREATE_LAYOUT=false
CREATE_LOADING=false
CREATE_ERROR=false

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --layout|-l)
            CREATE_LAYOUT=true
            shift
            ;;
        --loading)
            CREATE_LOADING=true
            shift
            ;;
        --error|-e)
            CREATE_ERROR=true
            shift
            ;;
        --all|-a)
            CREATE_LAYOUT=true
            CREATE_LOADING=true
            CREATE_ERROR=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./scripts/create-page.sh <page-path> [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --layout, -l     Create a layout.tsx file"
            echo "  --loading        Create a loading.tsx file"
            echo "  --error, -e      Create an error.tsx file"
            echo "  --all, -a        Create all optional files"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

PAGE_DIR="app/$PAGE_PATH"

# Check if page already exists
if [ -f "$PAGE_DIR/page.tsx" ]; then
    echo "Error: Page already exists at $PAGE_DIR/page.tsx"
    exit 1
fi

# Create directory
mkdir -p "$PAGE_DIR"

# Extract page name for component naming
PAGE_NAME=$(basename "$PAGE_PATH" | sed 's/\[//g' | sed 's/\]//g')
COMPONENT_NAME=$(echo "$PAGE_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')Page

# Check if it's a dynamic route
IS_DYNAMIC=false
if [[ "$PAGE_PATH" == *"["* ]]; then
    IS_DYNAMIC=true
    # Extract param name
    PARAM_NAME=$(echo "$PAGE_NAME" | sed 's/\.\.\.//g')
fi

# Create page.tsx
if [ "$IS_DYNAMIC" = true ]; then
    if [[ "$PAGE_PATH" == *"[..."* ]]; then
        # Catch-all route
        cat > "$PAGE_DIR/page.tsx" << EOF
export default async function ${COMPONENT_NAME}({
  params,
}: {
  params: { ${PARAM_NAME}: string[] }
}) {
  const path = params.${PARAM_NAME}.join("/")

  return (
    <div>
      <h1>${COMPONENT_NAME}</h1>
      <p>Path: {path}</p>
    </div>
  )
}
EOF
    else
        # Single dynamic param
        cat > "$PAGE_DIR/page.tsx" << EOF
export default async function ${COMPONENT_NAME}({
  params,
}: {
  params: { ${PARAM_NAME}: string }
}) {
  return (
    <div>
      <h1>${COMPONENT_NAME}</h1>
      <p>${PARAM_NAME}: {params.${PARAM_NAME}}</p>
    </div>
  )
}
EOF
    fi
else
    # Static route
    cat > "$PAGE_DIR/page.tsx" << EOF
export default function ${COMPONENT_NAME}() {
  return (
    <div>
      <h1>${COMPONENT_NAME}</h1>
      <p>Welcome to the ${PAGE_NAME} page</p>
    </div>
  )
}
EOF
fi

echo "Created: $PAGE_DIR/page.tsx"

# Create layout.tsx if requested
if [ "$CREATE_LAYOUT" = true ]; then
    LAYOUT_NAME=$(echo "$PAGE_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')Layout
    cat > "$PAGE_DIR/layout.tsx" << EOF
export default function ${LAYOUT_NAME}({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      {/* Add shared UI here */}
      {children}
    </section>
  )
}
EOF
    echo "Created: $PAGE_DIR/layout.tsx"
fi

# Create loading.tsx if requested
if [ "$CREATE_LOADING" = true ]; then
    cat > "$PAGE_DIR/loading.tsx" << EOF
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )
}
EOF
    echo "Created: $PAGE_DIR/loading.tsx"
fi

# Create error.tsx if requested
if [ "$CREATE_ERROR" = true ]; then
    cat > "$PAGE_DIR/error.tsx" << EOF
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-gray-600">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  )
}
EOF
    echo "Created: $PAGE_DIR/error.tsx"
fi

echo ""
echo "Page '$PAGE_PATH' created successfully!"
echo "Location: $PAGE_DIR"
echo ""
echo "Route: /$PAGE_PATH"
