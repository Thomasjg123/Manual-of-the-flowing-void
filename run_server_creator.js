const Agent = require('./agent');
const { sqlInsertCode } = require('./tools/specializedTools');
const { executeSql } = require('./sqlTool');

// Define the tools for this agent
const tools = {
  sql_insert_code: sqlInsertCode,
  sql_query: executeSql
};

// System prompt for the specialized agent
const systemPrompt = `You are a specialized Node.js server creator.
Your goal is to write a valid Express.js server that listens on 0.0.0.0:10001.
After writing the code, you MUST use the 'sql_insert_code' tool to save it into the database.

The 'sql_insert_code' tool takes three arguments: 'filename', 'content', and 'prompt'.
Example format:
Action: sql_insert_code | filename: server.js | content: <the code content> | prompt: <the prompt used>

Example of a successful interaction:
Thought: I will write the Express server and then save it to the database.
Action: sql_insert_code | filename: server.js | content: const express = require('express'); ... | prompt: Write a simple Express.js server...
Observation: { success: true, message: 'Query executed successfully' }
Thought: I have successfully saved the server code.
Final Answer: The server code has been saved to the database.
`;

async function main() {
  const agent = new Agent(systemPrompt, tools);
  
  const userPrompt = process.argv[2] || "Write a simple Express.js server that listens on 0.0.0.0:10001 and returns 'Hello World' at the root path. Save it with filename 'server.js'.";
  
  console.log("Starting serverNodejsCreator agent...");
  try {
    const result = await agent.run(userPrompt);
    console.log("\nAgent finished with result:", result);
  } catch (error) {
    console.error("\nAgent failed with error:", error.message);
  }
}

main();
