#!/bin/bash

# Create Scheduled Job Script for MedusaJS
# Creates a new scheduled job with cron configuration
# Usage: ./scripts/create-scheduled-job.sh <job-name>

set -e

if [ $# -eq 0 ]; then
    echo "Error: Job name required"
    echo "Usage: ./scripts/create-scheduled-job.sh <job-name>"
    echo "Example: ./scripts/create-scheduled-job.sh sync-inventory"
    exit 1
fi

JOB_NAME=$1
JOBS_DIR="src/jobs"
JOB_FILE="$JOBS_DIR/$JOB_NAME.ts"

# Create jobs directory if it doesn't exist
mkdir -p "$JOBS_DIR"

# Check if job already exists
if [ -f "$JOB_FILE" ]; then
    echo "Error: Job '$JOB_NAME' already exists at $JOB_FILE"
    exit 1
fi

echo "Creating scheduled job: $JOB_NAME"

# Create job file
cat > "$JOB_FILE" << 'EOF'
import { MedusaContainer } from "@medusajs/framework/types"

/**
 * Scheduled job handler
 * This function will be executed according to the schedule defined below
 */
export default async function jobHandler(container: MedusaContainer) {
  const logger = container.resolve("logger")

  try {
    logger.info("Starting scheduled job...")

    // TODO: Implement your job logic here
    // Example: const service = container.resolve("yourService")
    // await service.performScheduledTask()

    logger.info("Scheduled job completed successfully")
  } catch (error) {
    logger.error(`Scheduled job failed: ${error.message}`)
    throw error
  }
}

/**
 * Job configuration
 */
export const config = {
  name: "job-name",

  // Cron schedule examples:
  // "0 0 * * *"      - Daily at midnight
  // "0 */6 * * *"    - Every 6 hours
  // "*/15 * * * *"   - Every 15 minutes
  // "0 9 * * 1"      - Every Monday at 9 AM
  // "0 0 1 * *"      - First day of every month at midnight
  schedule: "0 0 * * *", // TODO: Set your schedule
}
EOF

# Replace job-name placeholder
sed -i.bak "s/job-name/$JOB_NAME/g" "$JOB_FILE" && rm "$JOB_FILE.bak"

echo ""
echo "Scheduled job '$JOB_NAME' created successfully!"
echo "Location: $JOB_FILE"
echo ""
echo "Next steps:"
echo "1. Implement your job logic in the jobHandler function"
echo "2. Configure the cron schedule in the config object"
echo "3. Restart your Medusa server to activate the job"
echo ""
echo "Cron schedule format: minute hour day month weekday"
echo "Visit https://crontab.guru/ for help with cron expressions"
