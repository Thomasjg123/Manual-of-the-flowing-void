const Agent = require('./agent');
const { sqlInsertCode } = require('./tools/specializedTools');
const { executeSql } = require('./sqlTool');

// Define the tools for this agent
const tools = {
  sql_insert_code: (args) => sqlInsertCode({ ...args, prompt_id: args.prompt_id || id }),
  sql_query: executeSql
};

async function saveCodeToDatabase(promptId, content) {
  try {
    // Strip HTML tags and escape single quotes for SQL
    const cleanedContent = content
      .replace(/<code[^>]*>/g, '')
      .replace(/<\/code>/g, '')
      .replace(/\\'/g, "'")  // Unescape backslash-escaped quotes
      .replace(/''/g, "'");   // Fix double single quotes from agent
    
    const finalContent = cleanedContent.replace(/'/g, "''");
    const insertQuery = `INSERT INTO code_snippets (filename, content, prompt_id) VALUES ('server.js', '${finalContent}', ${promptId})`;
    await executeSql(insertQuery);
    console.log(`Code saved to database with prompt_id: ${promptId}`);
  } catch (error) {
    console.error(`Error saving to database: ${error.message}`);
  }
}

async function main() {
  const idArg = process.argv[2];
  const id = parseInt(idArg, 10);

  if (isNaN(id)) {
    console.error("Usage: node run_server_creator.js <prompt_id>");
    process.exit(1);
  }

  let userPrompt = "";
  try {
    const rows = await executeSql(`SELECT content FROM prompts WHERE id = ${id}`);
    if (rows && rows.length > 0) {
      userPrompt = rows[0].content;
    } else {
      console.error(`Error: Prompt with ID ${id} not found.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error fetching prompt: ${error.message}`);
    process.exit(1);
  }

  const systemPrompt = `Your current prompt ID is ${id}. When using sql_insert_code, if you want to link to this prompt, use prompt_id: ${id} instead of prompt: <string>.`;
  const agent = new Agent(systemPrompt, tools);  
  
  console.log(`Starting serverNodejsCreator agent with prompt ID ${id}...`);
  try {
    const result = await agent.run(userPrompt);
    console.log("\nAgent finished with result:", result);
    // Automatically save the result to database
    await saveCodeToDatabase(id, result);
  } catch (error) {
    console.error("\nAgent failed with error:", error.message);
  }
}

main();