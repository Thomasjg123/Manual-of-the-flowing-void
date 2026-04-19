/**
 * agent.js
 * A simple ReAct agent.
 */

const axios = require('axios');
const { executeSql } = require('./sqlTool');
require('dotenv').config();

const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT || 'http://192.168.1.14:8080/v1/chat/completions';

class Agent {
  constructor(systemPrompt) {
    this.systemPrompt = systemPrompt;
    this.messages = [{ role: 'system', content: this.systemPrompt }];
  }

  async callLLM(messages) {
    try {
      const response = await axios.post(TARGET_ENDPOINT, {
        model: 'gpt-4', // Or whatever the endpoint expects
        messages: messages,
        temperature: 0,
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling LLM:', error.response ? error.response.data : error.message);
      throw new Error('Failed to communicate with LLM.');
    }
  }

  async run(userPrompt) {
    this.messages.push({ role: 'user', content: userPrompt });
    let currentMessages = [...this.messages];
    
    // Limit iterations to prevent infinite loops
    for (let i = 0; i < 10; i++) {
      const response = await this.callLLM(currentMessages);
      console.log(`\n--- Iteration ${i+1} ---\nLLM: ${response}`);

      // Check if the response is a tool call or a final answer
      if (response.includes('Action: sql_query')) {
        // Example format: Action: sql_query | Query: SELECT * FROM users
        const queryMatch = response.match(/Action: sql_query \| Query: (.+)/);
        if (queryMatch) {
          const query = queryMatch[1].trim();
          console.log(`Executing SQL: ${query}`);
          try {
            const result = await executeSql(query);
            const observation = `Observation: ${JSON.stringify(result)}`;
            console.log(observation);
            currentMessages.push({ role: 'assistant', content: response });
            currentMessages.push({ role: 'user', content: observation });
          } catch (err) {
            const observation = `Observation: Error: ${err.message}`;
            console.log(observation);
            currentMessages.push({ role: 'assistant', content: response });
            currentMessages.push({ role: 'user', content: observation });
          }
        } else {
          throw new Error("Invalid tool call format. Expected 'Action: sql_query | Query: <query>'");
        }
      } else if (response.includes('Final Answer:')) {
        const finalAnswer = response.split('Final Answer:')[1].trim();
        this.messages.push({ role: 'assistant', content: response });
        return finalAnswer;
      } else {
        // If no tool call and no final answer, treat as final answer or error
        this.messages.push({ role: 'assistant', content: response });
        return response;
      }
    }
    throw new Error('Agent reached maximum iterations without a final answer.');
  }
}

module.exports = Agent;
