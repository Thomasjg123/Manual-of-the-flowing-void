const db = require('../db');
const Agent = require('../agent');

/**
 * Batch Generator
 * Generates multiple variations of a prompt from the DB and saves them.
 */
async function generateBatch(promptId, count) {
  return new Promise((resolve, reject) => {
    db.get("SELECT content FROM prompts WHERE id = ?", [promptId], async (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error(`Prompt with ID ${promptId} not found.`));

      const originalPrompt = row.content;
      console.log(`Starting batch generation for Prompt ID: ${promptId}`);
      console.log(`Original Content: "${originalPrompt}"`);
      console.log(`Target count: ${count}\n`);

      const systemPrompt = "You are a creative prompt engineer. Your goal is to provide slight variations of a given prompt. Each variation should be slightly different in wording but preserve the core intent.";
      const agent = new Agent(systemPrompt);
      
      const successfulVariations = [];
      let attempts = 0;
      const maxAttempts = count * 5; // Prevent infinite loops

      while (successfulVariations.length < count && attempts < maxAttempts) {
        attempts++;
        
        // We ask the LLM for a variation. 
        // To encourage diversity, we can add a random element or a seed if the LLM supports it, 
        // but here we'll just ask for "a variation".
        const userInstruction = `Provide a single variation of this prompt. It must be slightly different in wording but keep the same meaning. Return ONLY the variation text: "${originalPrompt}"`;

        try {
          const variation = (await agent.run(userInstruction)).trim();

          // 1. Check if it's the same as the original
          if (variation === originalPrompt) {
            continue;
          }

          // 2. Check if it's already in the DB or already in our successful list
          // We can use a Promise to wrap the DB check
          const existsInDb = await new Promise((res) => {
            db.get("SELECT id FROM prompts WHERE content = ?", [variation], (err, existingRow) => {
              res(!!existingRow);
            });
          });

          const existsInCurrentBatch = successfulVariations.some(v => v === variation);

          if (!existsInDb && !existsInCurrentBatch) {
            // 3. Attempt to insert
            await new Promise((res, rej) => {
              db.run("INSERT INTO prompts (content) VALUES (?)", [variation], function(err) {
                if (err) {
                  // If it fails due to uniqueness, treat as existing
                  if (err.message.includes("UNIQUE constraint failed")) {
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
                successfulVariations.push(variation);
                console.log(`[${successfulVariations.length}/${count}] Generated: "${variation}"`);
              }
            });
          }
        } catch (error) {
          console.error(`Attempt ${attempts} failed: ${error.message}`);
        }
      }

      console.log(`\nBatch complete.`);
      console.log(`Successfully generated ${successfulVariations.length} unique variations.`);
      console.log(`Total attempts made: ${attempts}`);
      
      if (attempts >= maxAttempts) {
        console.warn("Warning: Reached max attempts without reaching target count.");
      }

      resolve(successfulVariations);
    });
  });
}

// Simple CLI interface
if (require.main === module) {
  const promptId = parseInt(process.argv[2]);
  const count = parseInt(process.argv[3]) || 10;

  if (isNaN(promptId)) {
    console.log("Usage: node batch_generator.js <prompt_id> <count>");
    process.exit(1);
  }

  generateBatch(promptId, count)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Batch generation failed:", err.message);
      process.exit(1);
    });
}

module.exports = { generateBatch };
