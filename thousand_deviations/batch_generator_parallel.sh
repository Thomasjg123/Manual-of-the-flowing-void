#!/bin/bash

# Usage: ./batch_generator_parallel.sh <count> <prompt_id>

COUNT=${1:-1}
PROMPT_ID=${2}

if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -lt 1 ]; then
  echo "❌ Please provide a valid number. Usage: ./batch_generator_parallel.sh <count> <prompt_id>"
  exit 1
fi

if [ -z "$PROMPT_ID" ]; then
  echo "❌ Please provide a prompt ID. Usage: ./batch_generator_parallel.sh <count> <prompt_id>"
  exit 1
fi

run_instance() {
  local i=$1
  local pid=$2
  local START=$(date +%s%3N)

  node thousand_deviations/single_variation.js "$pid" > /dev/null 2>&1
  local STATUS=$?

  local END=$(date +%s%3N)
  local ELAPSED=$(( END - START ))

  if [ $STATUS -eq 0 ]; then
    echo "  ✅ Instance $i done in ${ELAPSED}ms"
  else
    echo "  ❌ Instance $i failed in ${ELAPSED}ms"
  fi
}

export -f run_instance

TOTAL_START=$(date +%s%3N)

echo "🚀 Spawning $COUNT parallel instances for Prompt ID: $PROMPT_ID"
echo ""

for i in $(seq 1 $COUNT); do
  run_instance $i "$PROMPT_ID" &
done

wait

TOTAL_END=$(date +%s%3N)
TOTAL_ELAPSED=$(( TOTAL_END - TOTAL_START ))
TOTAL_SECONDS=$(echo "scale=2; $TOTAL_ELAPSED / 1000" | bc)
PER_INSTANCE=$(echo "scale=2; $TOTAL_SECONDS / $COUNT" | bc)

echo ""
echo "⏱️  Total time    : ${TOTAL_SECONDS}s"
echo "📦 Instances     : ${COUNT}"
echo "➗ Time/instance : ${PER_INSTANCE}s"
