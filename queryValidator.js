/**
 * queryValidator.js
 * Enforces security constraints on SQL queries.
 */

const PROTECTED_TABLES = ['conversations', 'messages'];
const FORBIDDEN_KEYWORDS = ['DROP', 'TRUNCATE', 'DELETE FROM CONVERSATIONS', 'DELETE FROM MESSAGES'];

function validateQuery(query) {
  const upperQuery = query.toUpperCase();

  // Check for forbidden keywords/patterns
  for (const forbidden of FORBIDDEN_KEYWORDS) {
    if (upperQuery.includes(forbidden)) {
      throw new Error(`Security Violation: Forbidden operation detected in query: ${forbidden}`);
    }
  }

  // Check if agent is trying to perform a DELETE on protected tables
  // (We already included 'DELETE FROM conversations/messages' in FORBIDDEN_KEYWORDS, 
  // but let's be more generic if needed)
  // For this implementation, we will allow the agent to DELETE only if it's not on protected tables.

  return true;
}

module.exports = { validateQuery };
