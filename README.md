# Project: Agent-Based Code Generation Testing

This project aims to test the reliability of LLM agents in generating valid Node.js/Express.js server code. The code is stored in a SQL database, and a manual testing process verifies the syntax and functionality.

## Architecture

### 1. Modular Agent System
The core `Agent` has been refactored to be tool-agnostic. Instead of hardcoded tool logic, it uses a dynamic tool registry. This allows for the creation of specialized agents with different capabilities.

### 2. Specialized Agent: `serverNodejsCreator`
A specific agent instance designed for one task:
- **Goal**: Write a Node.js Express server configured to listen on `0.0.0.0:10001`.
- **Tooling**: Equipped with a `sql_insert_code` tool to save the generated code into the database.
- **Constraint**: No bash/shell access is provided to the agent to ensure security.

### 3. Testing Workflow (Manual)
The testing is performed outside the agent loop to maintain a clean separation of concerns:
1. **Generation**: The `serverNodejsCreator` agent writes the code and inserts it into the SQL table.
2. **Extraction**: The code is retrieved from the database.
3. **Verification**: A bash script performs the following:
    - `node -c <file>`: Validates syntax.
    - `node <file> &`: Runs the server in the background.
    - `curl http://0.0.0.0:10001`: Tests the endpoint.
    - `kill <pid>`: Cleans up the process.

## Success Metrics
The failure rate is measured based on:
- **Syntax Errors**: Code that fails the `node -c` check.
- **Runtime Errors**: Code that fails the `curl` test.
- **Tooling Errors**: Failures in the agent's ability to call the SQL tool correctly.
