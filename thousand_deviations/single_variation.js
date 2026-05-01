const db = require('../db');
const Agent = require('../agent');

/**
 * Single Variation Generator
 * Generates exactly one variation of a prompt from the DB and saves it.
 */
async function generateSingleVariation(promptId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT content FROM prompts WHERE id = ?", [promptId], async (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error(`Prompt with ID ${promptId} not found.`));

      const originalPrompt = row.content;
      const systemPrompt = "You are a creative prompt engineer. Your goal is to provide slight variations of a given prompt. Each variation should be slightly different in wording but preserve the core intent.";
      const agent = new Agent(systemPrompt);

      const userInstruction = `Provide a single variation of this prompt. It must be slightly different in wording but keep the same meaning. Return ONLY the variation text: "${originalPrompt}"`;

      try {
        const variation = (await agent.run(userInstruction)).trim();

        if (variation === originalPrompt) {
          return reject(new Error("Variation is identical to original."));
        }

        // We attempt to insert. If it fails with UNIQUE constraint, it's not a "failure" 
        // of the script, it just means it's already there.
        await new Promise((res, rej) => {
          db.run("INSERT INTO prompts (content) VALUES (?)", [variation], function(err) {
            if (err) {
              if (err.message.includes("UNIQUE constraint failed")) {
                // This is a "soft" error for the purpose of the batch generator
                res(false);
              } else {
                rej(err);
              }
            } else {
              res(true);
            }
          });
        }).then((inserted) => {
          if (inserted) {
            resolve(variation);
          } else {
            // Instead of rejecting, we resolve with a special signal or just resolve empty
            // to indicate it was a duplicate.
            resolve("DUPLICATE");
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

if (require.main === module) {
  const promptId = parseInt(process.argv[2]);
  if (isNaN(promptId)) {
    console.error("Usage: node single_variation.js <prompt_id>");
    process.exit(1);
  }

  generateSingleVariation(promptId)
    .then((variation) => {
      if (variation === "DUPLICATE") {
        // Exit with 0 but print nothing or a specific message so the shell script knows
        process.exit(0);
      }
      console.log(variation);
      process.exit(0);
    })
    .catch((err) => {
      // If it's an error that we don't want to treat as a failure (like identical prompt), 
      // we might still want to exit 0. But for now, let's keep error exit for real errors.
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = { generateSingleVariation };
