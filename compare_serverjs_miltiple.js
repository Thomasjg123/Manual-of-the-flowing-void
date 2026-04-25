#!/usr/bin/env node

const { execSync } = require('child_process');

const DB = process.argv[2] || 'database.sqlite';

// Get all IDs
const rows = execSync(`sqlite3 ${DB} "SELECT id FROM code_snippets;"`).toString().trim().split('\n');

if (!rows.length) {
  console.log('❌ No snippets found.');
  process.exit(1);
}

// Fetch all snippets
const snippets = rows.map(id => ({
  id,
  content: execSync(`sqlite3 ${DB} "SELECT content FROM code_snippets WHERE id = ${id};"`).toString().trim()
}));

console.log(`\n📦 Found ${snippets.length} snippet(s)\n`);

const reference = snippets[0];
console.log(`📌 Reference: ID ${reference.id}\n`);

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

// Compare all to reference
const results = [];
for (let i = 1; i < snippets.length; i++) {
  const pct = parseFloat(similarity(reference.content, snippets[i].content));
  results.push({ id: snippets[i].id, pct });
}

// Sort by similarity descending
results.sort((a, b) => b.pct - a.pct);

// Print all
for (const { id, pct } of results) {
  const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
  const flag = pct < 50 ? ' ⚠️' : '';
  console.log(`  ID ${String(id).padEnd(4)} : ${bar} ${pct}%${flag}`);
}

// Summary
const avg = (results.reduce((s, r) => s + r.pct, 0) / results.length).toFixed(1);
const most_similar = results[0];
const most_different = results[results.length - 1];

console.log(`
📊 Summary (vs ID ${reference.id})
  Average similarity : ${avg}%
  Most similar       : ID ${most_similar.id} at ${most_similar.pct}%
  Most different     : ID ${most_different.id} at ${most_different.pct}%
`);
