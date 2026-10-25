/**
 * Merges data/leads.jsonl into src/data.json cleanly.
 */

const fs = require("fs");
const path = require("path");

const LEADS_FILE = path.join(__dirname, "..", "data", "leads.jsonl");
const DB_FILE = path.join(__dirname, "..", "src", "data.json");

if (!fs.existsSync(LEADS_FILE)) {
  console.log("No data/leads.jsonl file found yet.");
  process.exit(0);
}

const existing = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) : [];
const slugMap = new Map();

for (const item of existing) {
  if (item.slug) slugMap.set(item.slug, item);
}

const lines = fs.readFileSync(LEADS_FILE, "utf-8").split("\n");
let added = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const item = JSON.parse(line);
    if (item.slug && !slugMap.has(item.slug)) {
      slugMap.set(item.slug, item);
      added++;
    }
  } catch (e) {}
}

const merged = Array.from(slugMap.values());
fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf-8");

console.log(`Merged ${added} new records. Total companies in src/data.json: ${merged.length}`);
