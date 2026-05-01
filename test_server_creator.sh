#!/bin/bash

# Usage: ./run_and_test.sh [db_path]
DB=${1:-database.sqlite}

# --- Ensure columns exist ---
sqlite3 "$DB" "ALTER TABLE code_snippets ADD COLUMN compile INTEGER DEFAULT 0;" 2>/dev/null
sqlite3 "$DB" "ALTER TABLE code_snippets ADD COLUMN function INTEGER DEFAULT 0;" 2>/dev/null

# --- Get all IDs from the table ---
IDS=$(sqlite3 "$DB" "SELECT id FROM code_snippets WHERE function = 0;")
if [ -z "$IDS" ]; then
  echo "✅ All snippets have already been tested."
  exit 0
fi

# --- curl test function ---
check_url() {
  local LABEL=$1
  local URL=$2
  local HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL")
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo "  ✅ PASS - $LABEL ($URL) → HTTP $HTTP_CODE"
    return 0
  else
    echo "  ❌ FAIL - $LABEL ($URL) → HTTP $HTTP_CODE"
    return 1
  fi
}

# --- Get local IP ---
LOCAL_IP=$(hostname -I | awk '{print $1}')

PASS_TOTAL=0
FAIL_TOTAL=0

# --- Loop over every ID ---
for ID in $IDS; do
  echo ""
  echo "═══════════════════════════════════════"
  echo "📦 Snippet ID: $ID"
  echo "═══════════════════════════════════════"

  CODE=$(sqlite3 "$DB" "SELECT content FROM code_snippets WHERE id = $ID;")
  PROMPT=$(sqlite3 "$DB" "SELECT p.content FROM code_snippets cs JOIN prompts p ON cs.prompt_id = p.id WHERE cs.id = $ID;")
  
  if [ -z "$PROMPT" ]; then
    PROMPT="[No prompt recorded]"
  fi

  echo "📝 CODE: $ID"

  if [ -z "$CODE" ]; then
    echo "  ❌ FAIL - Empty snippet"
    (( FAIL_TOTAL++ ))
    continue
  fi

  PORT=10001
  echo "  🔌 Expected port: $PORT"

  # --- Syntax check ---
  echo ""
  echo "  🔍 Syntax check..."
  SYNTAX_ERR=$(echo "$CODE" | node -e "
    const chunks = [];
    process.stdin.on('data', d => chunks.push(d));
    process.stdin.on('end', () => {
      const code = chunks.join('');
      try { new Function(code); }
      catch(e) { console.error(e.message); process.exit(1); }
    });
  " 2>&1)

  if [ $? -ne 0 ]; then
    echo "  ❌ FAIL - Syntax error: $SYNTAX_ERR"
    (( FAIL_TOTAL++ ))
    continue
  else
    echo "  ✅ PASS - Syntax OK"
    sqlite3 "$DB" "UPDATE code_snippets SET compile = 1 WHERE id = $ID;"
  fi

  # --- Start server ---
  echo ""
  echo "  🚀 Starting server..."
  echo "$CODE" | node &
  SERVER_PID=$!
  sleep 2

  # --- curl tests ---
  echo ""
  echo "  🧪 Running curl tests..."
  SNIPPET_FAILED=0
  check_url "localhost" "http://localhost:$PORT/" || SNIPPET_FAILED=1

  if [ $SNIPPET_FAILED -eq 1 ]; then
    (( FAIL_TOTAL++ ))
  else
    (( PASS_TOTAL++ ))
    sqlite3 "$DB" "UPDATE code_snippets SET function = 1 WHERE id = $ID;"
  fi

  # --- Cleanup ---
  echo ""
  echo "  🛑 Stopping server (PID $SERVER_PID)..."
  kill $SERVER_PID 2>/dev/null
  wait $SERVER_PID 2>/dev/null
  sleep 1  # let the port free up before next snippet
done

# --- Summary ---
echo ""
echo "═══════════════════════════════════════"
echo "📊 Summary"
echo "═══════════════════════════════════════"
echo "  ✅ Passed: $PASS_TOTAL"
echo "  ❌ Failed: $FAIL_TOTAL"
echo ""
