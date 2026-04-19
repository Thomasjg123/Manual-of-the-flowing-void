/**
 * test_sql_tool.js
 */

const { executeSql } = require('./sqlTool');
const db = require('./db');

async function runTests() {
  console.log("Starting SQL Tool tests...");

  try {
    // Cleanup from previous runs
    await executeSql("DROP TABLE IF EXISTS test_table");
  } catch (e) {}

  try {
    // Test 1: Creating a dummy table
    console.log("\nTest 1: Creating a dummy table...");
    await executeSql("CREATE TABLE IF NOT EXISTS test_table (id INTEGER, name TEXT)");
    console.log("Success: dummy table created.");

    // Test 2: Inserting into dummy table
    console.log("\nTest 2: Inserting into dummy table...");
    await executeSql("INSERT INTO test_table (id, name) VALUES (1, 'Test Item')");
    console.log("Success: dummy data inserted.");

    // Test 3: Selecting from dummy table
    console.log("\nTest 3: Selecting from dummy table...");
    const rows = await executeSql("SELECT * FROM test_table");
    console.log("Result:", rows);

    // Test 4: Forbidden operation (DELETE from messages)
    console.log("\nTest 4: Attempting forbidden DELETE from messages...");
    try {
      await executeSql("DELETE FROM messages");
      console.log("FAILED: Should have thrown a security error.");
    } catch (err) {
      console.log("Success: Caught expected security error:", err.message);
    }

    // Test 5: Forbidden operation (DROP TABLE)
    console.log("\nTest 5: Attempting forbidden DROP TABLE...");
    try {
      await executeSql("DROP TABLE conversations");
      console.log("FAILED: Should have thrown a security error.");
    } catch (err) {
      console.log("Success: Caught expected security error:", err.message);
    }

    // Cleanup
    console.log("\nCleaning up...");
    await executeSql("DELETE FROM test_table");
    console.log("Cleanup successful.");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    db.close();
  }
}

runTests();
