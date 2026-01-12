#!/bin/bash

# Run Tests Script for MedusaJS
# Runs integration and unit tests
# Usage: ./scripts/run-tests.sh [http|modules|unit|all]

set -e

TEST_TYPE=${1:-all}

run_http_tests() {
    echo "Running HTTP integration tests..."
    TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules jest --silent=false --runInBand --forceExit
}

run_module_tests() {
    echo "Running module integration tests..."
    TEST_TYPE=integration:modules NODE_OPTIONS=--experimental-vm-modules jest --silent=false --runInBand --forceExit
}

run_unit_tests() {
    echo "Running unit tests..."
    TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules jest --silent --runInBand --forceExit
}

case $TEST_TYPE in
    http)
        run_http_tests
        ;;
    modules)
        run_module_tests
        ;;
    unit)
        run_unit_tests
        ;;
    all)
        echo "Running all tests..."
        echo ""
        run_http_tests
        echo ""
        run_module_tests
        echo ""
        run_unit_tests
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        echo "Usage: ./scripts/run-tests.sh [http|modules|unit|all]"
        exit 1
        ;;
esac

echo ""
echo "All tests completed!"
