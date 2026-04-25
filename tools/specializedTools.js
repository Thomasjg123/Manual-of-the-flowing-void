const { executeSql } = require('../sqlTool');

/**
 * Inserts code into the code_snippets table.
 * Expected args: { filename: string, content: string, prompt: string }
 */
async function sqlInsertCode({ filename, content, prompt }) {
  if (!filename || !content || !prompt) {
    throw new Error("Both 'filename', 'content', and 'prompt' are required for sql_insert_code.");
  }

  // Escape single quotes in filename, content and prompt for the SQL query
  const escapedFilename = filename.replace(/'/g, "''");
  const escapedContent = content.replace(/'/g, "''");
  const escapedPrompt = prompt.replace(/'/g, "''");

  // 1. Insert prompt (if not exists)
  const insertPromptQuery = `INSERT OR IGNORE INTO prompts (content) VALUES ('${escapedPrompt}')`;
  await executeSql(insertPromptQuery);

  // 2. Get prompt id
  const getPromptIdQuery = `SELECT id FROM prompts WHERE content = '${escapedPrompt}'`;
  const rows = await executeSql(getPromptIdQuery);
  const promptId = rows[0].id;

  // 3. Insert code
  const insertCodeQuery = `INSERT INTO code_snippets (filename, content, prompt_id) VALUES ('${escapedFilename}', '${escapedContent}', ${promptId})`;
  
  const result = await executeSql(insertCodeQuery);
  return result;
}

module.exports = { sqlInsertCode };
