#!/bin/bash

# Usage: ./create_nodejs_server_prallel.sh <count> <file_or_id> [additional_ids...]
COUNT=${1:-1}
shift

if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [ "$COUNT" -lt 1 ]; then
  echo "❌ Please provide a valid number. Usage: ./create_nodejs_server_prallel.sh <count> <file_or_id> [additional_ids...]"
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

if [ -n "$1" ] && [ -f "$1" ]; then
  echo "🚀 Reading prompts from file: $1"
  mapfile -t PROMPTS < "$1"
  
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
elif [ $# -eq 0 ]; then
  PROMPT="Write a simple Express.js server that listens on 0.0.0.0:10001 and returns 'Hello World' at the root path. Save it with filename 'server.js'."
  echo "🚀 Spawning $COUNT instance(s) with default prompt"
  echo ""

  for i in $(seq 1 $COUNT); do
    run_instance $i "$PROMPT" &
  done
  wait
  TOTAL_INSTANCES=$COUNT
else
  PROMPTS=("$@")
  
  # If we have fewer than COUNT arguments, repeat the first one.
  if [ ${#PROMPTS[@]} -lt "$COUNT" ]; then
    FIRST=${PROMPTS[0]}
    NEW_PROMPTS=()
    for ((i=0; i<COUNT; i++)); do
      if [ $i -lt ${#PROMPTS[@]} ]; then
        NEW_PROMPTS+=("${PROMPTS[$i]}")
      else
        NEW_PROMPTS+=("$FIRST")
      fi
    done
    PROMPTS=("${NEW_PROMPTS[@]}")
  fi

  # Limit to COUNT (in case more args were provided)
  PROMPTS=("${PROMPTS[@]:0:$COUNT}")
  NUM_PROMPTS=${#PROMPTS[@]}
  echo "🚀 Spawning $NUM_PROMPTS instances with provided IDs/prompts"
  echo ""

  for i in "${!PROMPTS[@]}"; do
    run_instance $((i+1)) "${PROMPTS[$i]}" &
  done
  wait
  TOTAL_INSTANCES=$NUM_PROMPTS
fi

TOTAL_END=$(date +%s%3N)
TOTAL_ELAPSED=$(( TOTAL_END - TOTAL_START ))
TOTAL_SECONDS=$(echo "scale=2; $TOTAL_ELAPSED / 1000" | bc)
PER_INSTANCE=$(echo "scale=2; $TOTAL_SECONDS / $TOTAL_INSTANCES" | bc)

echo ""
echo "⏱️  Total time    : ${TOTAL_SECONDS}s"
echo "📦 Instances     : ${TOTAL_INSTANCES}"
echo "➗ Time/instance : ${PER_INSTANCE}s"
