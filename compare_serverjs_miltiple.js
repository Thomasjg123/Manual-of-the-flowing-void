#!/usr/bin/env node

const { execSync } = require('child_process');

const DB = process.argv[2] || 'database.sqlite';

// Fetch IDs and prompt_ids
const idPromptRowsRaw = execSync(`sqlite3 -separator '|' ${DB} "SELECT cs.id, p.id FROM code_snippets cs JOIN prompts p ON cs.prompt_id = p.id;"`).toString().trim();

if (!idPromptRowsRaw) {
  console.log('❌ No snippets found.');
  process.exit(1);
}

const idPromptRows = idPromptRowsRaw.split('\n');

const snippets = idPromptRows.map(row => {
  const [id, prompt_id] = row.split('|');
  const content = execSync(`sqlite3 ${DB} "SELECT content FROM code_snippets WHERE id = ${id};"`).toString().trim();
  return { id, prompt_id, content };
});

console.log(`\n📦 Found ${snippets.length} snippet(s)\n`);

// Levenshtein distance
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 100 : (((maxLen - dist) / maxLen) * 100).toFixed(1);
}

// Group snippets by prompt_id
const groups = {};
for (const s of snippets) {
  if (!groups[s.prompt_id]) groups[s.prompt_id] = [];
  groups[s.prompt_id].push(s);
}

// 1. Intra-prompt comparison
console.log('🔍 Intra-prompt comparisons:');
let intraCount = 0;
for (const [promptId, group] of Object.entries(groups)) {
  if (group.length > 1) {
    console.log(`\n  Prompt ID: ${promptId}`);
    for (let i = 1; i < group.length; i++) {
      const pct = parseFloat(similarity(group[0].content, group[i].content));
      const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
      console.log(`    ID ${String(group[i].id).padEnd(4)} : ${bar} ${pct}% (vs ID ${group[0].id})`);
      intraCount++;
    }
  }
}
if (intraCount === 0) console.log('  (No multiple snippets for the same prompt)');

// 2. Inter-prompt comparison (first snippet vs others with different prompt)
const firstSnippet = snippets[0];
console.log(`\n\n🚀 Inter-prompt comparisons (Reference: ID ${firstSnippet.id}, Prompt: ${firstSnippet.prompt_id}):`);
const interResults = [];
for (let i = 1; i < snippets.length; i++) {
  if (snippets[i].prompt_id !== firstSnippet.prompt_id) {
    const pct = parseFloat(similarity(firstSnippet.content, snippets[i].content));
    interResults.push({ id: snippets[i].id, pct });
  }
}

if (interResults.length > 0) {
  interResults.sort((a, b) => b.pct - a.pct);
  for (const { id, pct } of interResults) {
    const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
    const flag = pct < 50 ? ' ⚠️' : '';
    console.log(`  ID ${String(id).padEnd(4)} : ${bar} ${pct}%${flag}`);
  }

  // Summary for inter-prompt
  const avg = (interResults.reduce((s, r) => s + r.pct, 0) / interResults.length).toFixed(1);
  const most_similar = interResults[0];
  const most_different = interResults[interResults.length - 1];
  console.log(`
📊 Inter-prompt Summary (vs ID ${firstSnippet.id})
  Average similarity : ${avg}%
  Most similar       : ID ${most_similar.id} at ${most_similar.pct}%
  Most different     : ID ${most_different.id} at ${most_different.pct}%
  `);
} else {
  console.log('  (No snippets with different prompts found)');
}
