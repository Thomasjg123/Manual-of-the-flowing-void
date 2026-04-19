# Agent Harness

A lightweight Node.js implementation of a ReAct (Reasoning and Acting) agent capable of interacting with a SQLite database via tool calls.

## Overview

The Agent Harness provides a framework where an LLM (Large Language Model) can perform complex tasks by reasoning about a user's request and choosing to use available tools. This project specifically implements a SQL tool, allowing the agent to query and manipulate a local SQLite database to answer questions or perform data-driven tasks.

## How it Works: The ReAct Pattern

The core of the system is the **ReAct** loop implemented in `agent.js`. The agent follows these steps:

1.  **Thought**: The agent sends the current conversation history (including system instructions) to the LLM.
2.  **Action**: The LLM, guided by the system prompt, decides whether it needs to use a tool. It responds with a specific action format:
    `Action: sql_query | Query: <your_sql_query>`
3.  **Observation**: The harness intercepts this action, executes the SQL query using `sqlTool.js`, and captures the result (or any error). This result is appended back to the conversation as an `Observation: <result>`.
4.  **Final Answer**: The agent repeats this loop until the LLM determines it has sufficient information to provide a final response, using the format:
    `Final Answer: <your_answer>`

## Features

- **ReAct Agent Implementation**: A robust reasoning loop for tool-augmented LLM interaction.
- **SQL Tooling**: A specialized tool for executing safe (validated) SQL queries against a SQLite database.
- **Conversation Management**: Persistence of chat history and conversation state in a SQLite database.
- **RESTful API**: An Express-based API to interact with the agent via HTTP.
- **Real-time Logging**: Detailed console output of the agent's thought process and tool executions.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **LLM Communication**: Axios (communicating with an OpenAI-compatible API)
- **Core Logic**: ReAct pattern

## Project Structure

- `server.js`: The entry point and Express server configuration.
- `agent.js`: The core ReAct agent logic and reasoning loop.
- `chatService.js`: Manages conversation state and database persistence.
- `sqlTool.js`: The implementation of the SQL execution tool.
- `db.js`: Database connection and utility functions.
- `queryValidator.js`: Security layer to validate SQL queries.
- `public/`: Frontend assets for the web interface.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env` file:
   ```env
   TARGET_ENDPOINT=your_llm_api_endpoint
   PORT=3000
   ```

## Usage

Start the server:
```bash
node server.js
```

The API endpoints are:
- `POST /v1/conversations`: Start a new conversation.
- `POST /v1/chat/:conversationId`: Send a message to the agent.
- `GET /v1/history/:conversationId`: Retrieve the chat history.
