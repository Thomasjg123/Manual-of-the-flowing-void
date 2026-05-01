#!/bin/bash

# Usage: ./run_unfinished_prompts.sh <target_count>

TARGET_COUNT=${1:-5}
DB="database.sqlite"

echo "🔍 Checking snippet counts for all prompts (Target: $TARGET_COUNT per prompt)..."

# Get list of "id|count" for all prompts
# We use a LEFT JOIN to ensure we get prompts even if they have 0 snippets
PROMPT_DATA=$(sqlite3 "$DB" "SELECT p.id, COUNT(cs.id) FROM prompts p LEFT JOIN code_snippets cs ON p.id = cs.prompt_id GROUP BY p.id;" 2>/dev/null)

if [ -z "$PROMPT_DATA" ]; then
  echo "❌ Error: Could not retrieve prompt data or database is empty."
  exit 1
fi

# Convert to array of lines
readarray -t DATA_ARRAY <<< "$PROMPT_DATA"
TOTAL_PROMPTS=${#DATA_ARRAY[@]}
echo "📦 Found $TOTAL_PROMPTS total prompts."
echo "🚀 Starting process..."

for line in "${DATA_ARRAY[@]}"; do
  # Split the line by the pipe character
  IFS='|' read -r id count <<< "$line"
  
  # Check if count is a number (sqlite3 might return empty or non-numeric if error)
  if [[ ! "$count" =~ ^[0-9]+$ ]]; then
    continue
  fi

  if [ "$count" -lt "$TARGET_COUNT" ]; then
    needed=$(( TARGET_COUNT - count ))
    echo "--------------------------------------------------"
    echo "🔄 Prompt ID: $id (Current: $count, Needed: $needed)"
    
    # Run the parallel script for the remaining number of instances needed
    ./create_nodejs_server_prallel.sh "$needed" "$id"
    
    echo "✅ Done with Prompt ID: $id"
  fi
done

echo "--------------------------------------------------"
echo "🏁 All prompts processed to reach target count of $TARGET_COUNT."
