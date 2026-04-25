/**
 * agent.js
 * A simple ReAct agent.
 */

const axios = require('axios');
require('dotenv').config();

const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT || 'http://192.168.1.14:8080/v1/chat/completions';

class Agent {
  constructor(systemPrompt, tools = {}) {
    this.systemPrompt = systemPrompt;
    this.tools = tools;
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
      const toolMatch = response.match(/Action:\s*(\w+)\s*\|?\s*([\s\S]*)/);
      
      if (toolMatch) {
        const [_, toolName, argsString] = toolMatch;
        const tool = this.tools[toolName];

        if (tool) {
          const args = {};
          if (argsString.includes(':')) {
            // We split by '|' but we must be careful if the content itself contains '|'
            // A better way is to split by '|' only when it's followed by ' Key:'
            const pairs = argsString.split(/\|(?=\s*\w+:)/);
            for (const pair of pairs) {
              const colonIndex = pair.indexOf(':');
              if (colonIndex !== -1) {
                const key = pair.substring(0, colonIndex).trim();
                let value = pair.substring(colonIndex + 1).trim();

                // Stop at the first newline that is followed by a ReAct keyword
                const reActComponents = /\n(Observation:|Thought:|Final Answer:)/;
                const match = value.match(reActComponents);
                if (match) {
                  value = value.substring(0, match.index).trim();
                }

                args[key] = value;
              }
            }
          } else if (argsString.trim()) {
            args['query'] = argsString.trim();
          }


          console.log(`Executing ${toolName} with args:`, args);
          try {
            const result = await tool(args);
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
          throw new Error(`Tool '${toolName}' not found in registry.`);
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
