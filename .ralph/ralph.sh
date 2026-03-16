#!/bin/bash
# Ralph Loop Runner for Financial Tracker
# Usage: ./ralph.sh

set -e

RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$RALPH_DIR/logs/$(date +%Y%m%d_%H%M%S).log"

echo "Ralph starting at $(date)" | tee "$LOG_FILE"
echo "Working directory: $RALPH_DIR" | tee -a "$LOG_FILE"

# Run Claude with the prompt
claude --print "$RALPH_DIR/PROMPT.md" 2>&1 | tee -a "$LOG_FILE"

echo "Ralph completed at $(date)" | tee -a "$LOG_FILE"
