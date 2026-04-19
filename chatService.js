/**
 * chatService.js
 * Manages conversations and ensures automatic logging to the database.
 */

const db = require('./db');
const Agent = require('./agent');

class ChatService {
  constructor(systemPrompt) {
    this.systemPrompt = systemPrompt;
    this.agent = new Agent(this.systemPrompt);
  }

  async createConversation() {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO conversations (created_at) VALUES (CURRENT_TIMESTAMP)`, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async saveMessage(conversationId, sender, content) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (conversation_id, sender, content, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [conversationId, sender, content],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getChatHistory(conversationId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT sender, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
        [conversationId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async chat(conversationId, userPrompt) {
    // 1. Save user message
    await this.saveMessage(conversationId, 'user', userPrompt);

    // 2. Get history to provide context to agent (optional, but good practice)
    const history = await this.getChatHistory(conversationId);
    // For now, we'll just use the agent's internal memory which we can extend.
    // But to be a true "harness", the agent should probably be stateless and get context from history.
    // However, for this simple version, I'll let the agent handle its own memory for now.

    // 3. Run the agent
    try {
      const agentResponse = await this.agent.run(userPrompt);

      // 4. Save agent response
      await this.saveMessage(conversationId, 'agent', agentResponse);

      return agentResponse;
    } catch (error) {
      const errorMsg = `Error: ${error.message}`;
      await this.saveMessage(conversationId, 'agent', errorMsg);
      throw error;
    }
  }
}

module.exports = ChatService;
