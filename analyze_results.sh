#!/bin/bash

# Usage: ./analyze_results.sh [db_path]
DB=${1:-database.sqlite}

if [ ! -f "$DB" ]; then
  echo "❌ Database file not found: $DB"
  exit 1
fi

# Ensure columns exist in prompts table
sqlite3 "$DB" "ALTER TABLE prompts ADD COLUMN compile_rate REAL DEFAULT 0.0;" 2>/dev/null
sqlite3 "$DB" "ALTER TABLE prompts ADD COLUMN function_rate REAL DEFAULT 0.0;" 2>/dev/null

# Update the rates in the prompts table
sqlite3 "$DB" "
UPDATE prompts 
SET 
    compile_rate = (SELECT AVG(compile) * 100 FROM code_snippets WHERE prompt_id = prompts.id),
    function_rate = (SELECT AVG(function) * 100 FROM code_snippets WHERE prompt_id = prompts.id)
WHERE id IN (SELECT prompt_id FROM code_snippets);
"

echo "📊 Prompt-wise Pass Rates"
echo "══════════════════════════════════════════════════════════════════════════════════════"
printf "%-5s | %-60s | %-12s | %-12s | %-8s\n" "ID" "Prompt" "Compile %" "Function %" "Total"
echo "---------------------------------------------------------------------------------------------------------------------------------------"

sqlite3 "$DB" "
SELECT 
    p.id,
    REPLACE(REPLACE(p.content, char(10), ' '), char(13), ' ') as prompt_text,
    p.compile_rate,
    p.function_rate,
    (SELECT COUNT(*) FROM code_snippets WHERE prompt_id = p.id) as count
FROM prompts p
WHERE EXISTS (SELECT 1 FROM code_snippets WHERE prompt_id = p.id);
" | while IFS='|' read -r prompt_id prompt compile function count; do
    # Trim whitespace
    prompt=$(echo "$prompt" | xargs)
    [ -z "$prompt" ] && continue

    compile_fmt=$(printf "%.2f%%" "$compile")
    function_fmt=$(printf "%.2f%%" "$function")
    count=$(echo "$count" | xargs)

    # Truncate long prompts
    if [ ${#prompt} -gt 40 ]; then
        prompt="${prompt:0:37}..."
    fi

    printf "%-5s | %-60s | %-12s | %-12s | %-8s\n" "$prompt_id" "$prompt" "$compile_fmt" "$function_fmt" "$count"
done

echo "══════════════════════════════════════════════════════════════════════════════════════"
