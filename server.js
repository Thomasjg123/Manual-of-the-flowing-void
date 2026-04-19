/**
 * server.js
 * The Express server for the agent harness.
 */

const express = require('express');
const path = require('path');
const ChatService = require('./chatService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const systemPrompt = `You are a helpful AI agent with access to a SQL database.
You can use the 'sql_query' tool to interact with the database.
The database has two tables: 'conversations' and 'messages'.

When you use the tool, use this format:
Action: sql_query | Query: <your_sql_query>

After you have finished your task or have the answer, provide your final answer in this format:
Final Answer: <your_answer>

Be concise and helpful.`;

const chatService = new ChatService(systemPrompt);

// Endpoint to start a new conversation
app.post('/v1/conversations', async (req, res) => {
  try {
    const conversationId = await chatService.createConversation();
    res.json({ conversationId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to chat
app.post('/v1/chat/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await chatService.chat(parseInt(conversationId), message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get history
app.get('/v1/history/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  try {
    const history = await chatService.getChatHistory(parseInt(conversationId));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
