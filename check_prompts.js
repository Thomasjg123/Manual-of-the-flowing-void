const { executeSql } = require('./sqlTool');

async function main() {
  try {
    const rows = await executeSql('SELECT id, content FROM prompts');
    console.log(rows);
  } catch (error) {
    console.error(error);
  }
}

main();
