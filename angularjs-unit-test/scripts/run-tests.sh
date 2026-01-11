#!/bin/bash

###############################################################################
# AngularJS Unit Test Runner
#
# Comprehensive bash script for running AngularJS unit tests with various
# configurations and options.
#
# Usage:
#   ./run-tests.sh                    # Run all tests
#   ./run-tests.sh --watch            # Watch mode
#   ./run-tests.sh --coverage         # With coverage report
#   ./run-tests.sh --browsers Chrome  # Specific browser
#   ./run-tests.sh --single-run       # Single test run for CI/CD
#
###############################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_DIR="$PROJECT_DIR/test"
COVERAGE_DIR="$PROJECT_DIR/coverage"
KARMA_CONFIG="$PROJECT_DIR/karma.conf.js"

# Default options
WATCH_MODE=false
COVERAGE_MODE=false
SINGLE_RUN=false
BROWSERS="ChromeHeadless"
VERBOSE=false

###############################################################################
# Functions
###############################################################################

# Print colored output
print_status() {
  echo -e "${GREEN}[TEST]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Display help
show_help() {
  cat << EOF
AngularJS Unit Test Runner

Usage: run-tests.sh [options]

Options:
  --watch              Enable watch mode (tests re-run on file changes)
  --coverage           Generate code coverage report
  --single-run         Run tests once (for CI/CD)
  --browsers BROWSER   Specify browser(s) to use (default: ChromeHeadless)
  --verbose            Verbose output
  --help               Show this help message

Examples:
  ./run-tests.sh
  ./run-tests.sh --watch --coverage
  ./run-tests.sh --single-run --coverage
  ./run-tests.sh --browsers Chrome,Firefox
EOF
}

# Parse command line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --watch)
        WATCH_MODE=true
        shift
        ;;
      --coverage)
        COVERAGE_MODE=true
        shift
        ;;
      --single-run)
        SINGLE_RUN=true
        shift
        ;;
      --browsers)
        BROWSERS="$2"
        shift 2
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --help)
        show_help
        exit 0
        ;;
      *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
    esac
  done
}

# Check prerequisites
check_prerequisites() {
  print_status "Checking prerequisites..."

  if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
  fi

  if ! command -v karma &> /dev/null; then
    print_warning "karma not found globally, will use local installation"
    KARMA_CMD="npx karma"
  else
    KARMA_CMD="karma"
  fi

  if [ ! -f "$KARMA_CONFIG" ]; then
    print_error "karma.conf.js not found at $KARMA_CONFIG"
    exit 1
  fi

  print_status "Prerequisites check passed ✓"
}

# Install dependencies
install_dependencies() {
  print_status "Installing dependencies..."
  npm install
}

# Build test suite
build_tests() {
  print_status "Building tests..."

  # Check if there's a build step
  if grep -q '"build:test"' "$PROJECT_DIR/package.json"; then
    npm run build:test
  fi
}

# Run tests
run_tests() {
  print_status "Running tests..."

  local KARMA_ARGS="$KARMA_CONFIG"

  # Add watch mode if enabled
  if [ "$WATCH_MODE" = true ]; then
    print_status "Watch mode enabled - tests will re-run on file changes"
  else
    KARMA_ARGS="$KARMA_ARGS --single-run"
  fi

  # Add coverage if enabled
  if [ "$COVERAGE_MODE" = true ]; then
    KARMA_ARGS="$KARMA_ARGS --coverage"
    print_status "Code coverage enabled"
  fi

  # Add browsers
  KARMA_ARGS="$KARMA_ARGS --browsers $BROWSERS"

  # Add verbose if enabled
  if [ "$VERBOSE" = true ]; then
    KARMA_ARGS="$KARMA_ARGS --log-level DEBUG"
  fi

  # Run karma
  if ! $KARMA_CMD start $KARMA_ARGS; then
    print_error "Tests failed!"
    return 1
  fi

  return 0
}

# Generate coverage report
generate_coverage_report() {
  if [ "$COVERAGE_MODE" = true ] && [ -d "$COVERAGE_DIR" ]; then
    print_status "Generating coverage report..."

    if [ -f "$COVERAGE_DIR/index.html" ]; then
      print_status "Coverage report generated at: $COVERAGE_DIR/index.html"

      # Try to open coverage report in browser (macOS)
      if command -v open &> /dev/null; then
        open "$COVERAGE_DIR/index.html"
      fi
    fi
  fi
}

# Display test summary
show_summary() {
  print_status "Test run completed"

  if [ "$COVERAGE_MODE" = true ]; then
    if [ -f "$COVERAGE_DIR/index.html" ]; then
      print_status "Coverage report available at: $COVERAGE_DIR/index.html"
    fi
  fi

  if [ "$WATCH_MODE" = true ]; then
    print_status "Watch mode active - press Ctrl+C to exit"
  fi
}

# Main execution
main() {
  parse_arguments "$@"

  print_status "AngularJS Unit Test Runner"
  print_status "Project directory: $PROJECT_DIR"

  check_prerequisites
  install_dependencies
  build_tests

  if run_tests; then
    generate_coverage_report
    show_summary
    exit 0
  else
    print_error "Test execution failed"
    exit 1
  fi
}

# Run main function
main "$@"
