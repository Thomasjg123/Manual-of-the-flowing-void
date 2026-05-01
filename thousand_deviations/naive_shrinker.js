const Agent = require('../agent');

/**
 * Naive Shrinker
 * Simply asks the LLM to shorten the provided prompt.
 */
async function naiveShrink(originalPrompt) {
  // We use a very simple system prompt for this task.
  const systemPrompt = "You are a helpful assistant that specializes in shortening prompts while preserving their original meaning.";
  const agent = new Agent(systemPrompt);

  console.log(`\nOriginal Prompt: "${originalPrompt}"`);
  console.log(`Length: ${originalPrompt.length} chars`);

  const userInstruction = `Please provide a slightly shorter version of the following prompt. Return ONLY the shortened prompt and nothing else: "${originalPrompt}"`;

  try {
    const result = await agent.run(userInstruction);
    
    console.log(`\nShortened Prompt: "${result}"`);
    console.log(`Length: ${result.length} chars`);
    console.log(`Difference: ${originalPrompt.length - result.length} chars`);
    
    return result;
  } catch (error) {
    console.error("Error during naive shrink:", error.message);
    throw error;
  }
}

// Simple CLI interface
if (require.main === module) {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.log("Usage: node naive_shrinker.js \"<your prompt here>\"");
    process.exit(1);
  }
  naiveShrink(input).catch(() => process.exit(1));
}

module.exports = { naiveShrink };
