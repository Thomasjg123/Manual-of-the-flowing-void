# Prompt Consistency Testing Plan

## Objective
To track which prompts generate which code snippets by introducing a `prompts` table and linking it to `code_snippets` via a foreign key.

## Database Migration Plan
1. **Create `prompts` table**:
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `content`: TEXT (UNIQUE)
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
2. **Recreate `code_snippets` table**:
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `filename`: TEXT
   - `content`: TEXT
   - `prompt_id`: INTEGER (FOREIGN KEY referencing `prompts.id`)
3. **Data Migration**:
   - Migrate existing `code_snippets` to the new table, setting `prompt_id` to `NULL` for legacy records.
   - Drop old table and rename new one.

## Tooling & Agent Integration
1. **Update `sql_insert_code` tool**:
   - Accept `prompt` text as an argument.
   - Check if prompt exists in `prompts` table.
   - Insert prompt if needed and get `id`.
   - Insert code into `code_snippets` with the `prompt_id`.
2. **Update Agent Prompt**:
   - Instruct agent to include the prompt text in its `sql_insert_code` action.

## Scripting Updates
1. **`run_server_creator.js`**: Accept prompt via `process.argv[2]`.
2. **`create_nodejs_server_prallel.sh`**: Support passing prompt files (one prompt per line) or single prompt strings.
3. **`test_server_creator.sh`**: Update SQL query to `JOIN` with `prompts` to show prompt content in test results.

## Verification
- Run parallel creation with a file of diverse prompts.
- Run the test script and verify results include prompt info and correct pass/fail status.
