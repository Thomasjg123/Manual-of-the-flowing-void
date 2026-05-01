const { executeSql } = require('./sqlTool');
const axios = require('axios');
require('dotenv').config();

const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT || 'http://192.168.1.14:8080/v1/chat/completions';

async function callLLM(messages) {
  try {
    const response = await axios.post(TARGET_ENDPOINT, {
      model: 'gpt-4',
      messages: messages,
      temperature: 0,
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling LLM:', error.response ? error.response.data : error.message);
    throw new Error('Failed to communicate with LLM.');
  }
}

function extractCodeFromResponse(response) {
  const codeBlockRegex = /<code[^>]*>([\s\S]*?)<\/code>/;
  const match = response.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

async function saveCodeToDatabase(promptId, code) {
  try {
    const escapedCode = code.replace(/'/g, "''");
    const insertQuery = `INSERT INTO code_snippets (filename, content, prompt_id) VALUES ('server.js', '${escapedCode}', ${promptId})`;
    await executeSql(insertQuery);
    console.log(`Code saved to database with prompt ID: ${promptId}`);
  } catch (error) {
    console.error(`Error saving to database: ${error.message}`);
    throw error;
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

  const messages = [
    { role: 'user', content: userPrompt }
  ];

  console.log(`Starting serverNodejsCreator agent with prompt ID ${id}...`);
  try {
    let llmResponse;
    try {
      llmResponse = await callLLM(messages);
    } catch (error) {
      await saveCodeToDatabase(id, "This does not produce useable code");
      throw error;
    }

    let code = extractCodeFromResponse(llmResponse);

    if (!code) {
      console.log("No <code> tags found in LLM response, retrying...");
      try {
        llmResponse = await callLLM(messages);
        code = extractCodeFromResponse(llmResponse);
      } catch (error) {
        await saveCodeToDatabase(id, "This does not produce useable code");
        throw error;
      }
    }

    if (!code) {
      await saveCodeToDatabase(id, "This does not produce useable code");
      throw new Error("No <code> tags found in LLM response after retry.");
    }

    console.log(`\n--- LLM Response ---\n${llmResponse}`);
    console.log(`\n--- Extracted Code ---\n${code}`);

    await saveCodeToDatabase(id, code);
    console.log("\nDone.");
  } catch (error) {
    console.error("\nAgent failed with error:", error.message);
    process.exit(1);
  }
}

main();
