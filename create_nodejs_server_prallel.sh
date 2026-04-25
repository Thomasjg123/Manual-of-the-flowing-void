#!/bin/bash

# Usage: ./create_nodejs_server_prallel.sh <count> [prompt_or_file]
COUNT=${1:-1}
PROMPT_ARG=${2:-""}

if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -lt 1 ]; then
  echo "❌ Please provide a valid number. Usage: ./create_nodejs_server_prallel.sh <count> [prompt_or_file]"
  exit 1
fi

run_instance() {
  local i=$1
  local prompt=$2
  local START=$(date +%s%3N)

  node run_server_creator.js "$prompt" > /dev/null 2>&1
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

if [ -n "$PROMPT_ARG" ] && [ -f "$PROMPT_ARG" ]; then
  echo "🚀 Reading prompts from file: $PROMPT_ARG"
  mapfile -t PROMPTS < "$PROMPT_ARG"
  
  # Limit to COUNT
  PROMPTS=("${PROMPTS[@]:0:$COUNT}")
  NUM_PROMPTS=${#PROMPTS[@]}
  echo "📦 Number of prompts to run: $NUM_PROMPTS"
  echo ""

  for i in "${!PROMPTS[@]}"; do
    run_instance $((i+1)) "${PROMPTS[$i]}" &
  done
  wait
  TOTAL_INSTANCES=$NUM_PROMPTS
else
  PROMPT=${PROMPT_ARG:-"Write a simple Express.js server that listens on 0.0.0.0:10001 and returns 'Hello World' at the root path. Save it with filename 'server.js'."}
  echo "🚀 Spawning $COUNT instance(s) with prompt: $PROMPT"
  echo ""

  for i in $(seq 1 $COUNT); do
    run_instance $i "$PROMPT" &
  done
  wait
  TOTAL_INSTANCES=$COUNT
fi

TOTAL_END=$(date +%s%3N)
TOTAL_ELAPSED=$(( TOTAL_END - TOTAL_START ))
TOTAL_SECONDS=$(echo "scale=2; $TOTAL_ELAPSED / 1000" | bc)
PER_INSTANCE=$(echo "scale=2; $TOTAL_SECONDS / $TOTAL_INSTANCES" | bc)

echo ""
echo "⏱️  Total time    : ${TOTAL_SECONDS}s"
echo "📦 Instances     : ${TOTAL_INSTANCES}"
echo "➗ Time/instance : ${PER_INSTANCE}s"
