/**
 * sqlTool.js
 * A tool for the agent to interact with the SQLite database.
 */

const db = require('./db');
const { validateQuery } = require('./queryValidator');

async function executeSql(query) {
  try {
    // 1. Validate the query
    validateQuery(query);

    console.log(`[SQL Tool] Executing: ${query}`);

    return new Promise((resolve, reject) => {
      const upperQuery = query.trim().toUpperCase();
      
      if (upperQuery.startsWith('SELECT')) {
        db.all(query, [], (err, rows) => {
          if (err) {
            reject(new Error(`SQL Error: ${err.message}`));
          } else {
            resolve(rows);
          }
        });
      } else {
        db.run(query, [], (err) => {
          if (err) {
            reject(new Error(`SQL Error: ${err.message}`));
          } else {
            resolve({ success: true, message: 'Query executed successfully' });
          }
        });
      }
    });
  } catch (error) {
    throw error;
  }
}

module.exports = { executeSql };
