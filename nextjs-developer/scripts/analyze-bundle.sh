#!/bin/bash

# Bundle Analyzer Script for Next.js
# Analyzes the production bundle to identify size issues
# Usage: ./scripts/analyze-bundle.sh

set -e

echo "Next.js Bundle Analyzer"
echo ""

# Check if @next/bundle-analyzer is installed
if ! npm list @next/bundle-analyzer --depth=0 &>/dev/null; then
    echo "Installing @next/bundle-analyzer..."
    npm install --save-dev @next/bundle-analyzer
    echo ""
fi

# Check if next.config.js already has bundle analyzer configured
if grep -q "bundle-analyzer" next.config.js 2>/dev/null || grep -q "bundle-analyzer" next.config.mjs 2>/dev/null; then
    echo "Bundle analyzer is already configured in next.config"
else
    echo "Note: You may need to configure @next/bundle-analyzer in your next.config.js"
    echo ""
    echo "Example configuration:"
    echo ""
    echo "  // next.config.js"
    echo "  const withBundleAnalyzer = require('@next/bundle-analyzer')({"
    echo "    enabled: process.env.ANALYZE === 'true',"
    echo "  })"
    echo ""
    echo "  module.exports = withBundleAnalyzer({"
    echo "    // your existing config"
    echo "  })"
    echo ""
fi

echo "Running production build with bundle analysis..."
echo ""

ANALYZE=true npm run build

echo ""
echo "Bundle analysis complete!"
echo ""
echo "The analyzer will open in your browser showing:"
echo "  - Client bundles (what's sent to the browser)"
echo "  - Server bundles (server-side code)"
echo ""
echo "Tips for reducing bundle size:"
echo "  1. Use dynamic imports for large components"
echo "  2. Check for duplicate dependencies"
echo "  3. Use Server Components where possible"
echo "  4. Review third-party library sizes"
echo "  5. Use tree-shaking friendly imports"
