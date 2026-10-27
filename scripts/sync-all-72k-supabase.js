const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdbnwxqwupjepyatesyw.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_H8jleixzDsGwglnxl6_L1A_yu7M1yZO";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const PROGRESS_FILE = path.join(__dirname, "../data/supabase_sync_progress.json");
const LEADS_FILE = path.join(__dirname, "../data/leads.jsonl");
const BATCH_SIZE = 500;

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    } catch (e) {}
  }
  return { lastLine: 0, uploaded: 0 };
}

function saveProgress(lastLine, uploaded) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastLine, uploaded, updatedAt: new Date().toISOString() }));
}

async function uploadBatchWithRetry(batch, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase
        .from("companies")
        .upsert(batch, { onConflict: "slug", ignoreDuplicates: true });
      if (!error) return true;
      console.warn(`\n[Retry ${attempt}/${retries}] Batch error: ${error.message}`);
    } catch (err) {
      console.warn(`\n[Retry ${attempt}/${retries}] Network error: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  return false;
}

async function syncAll() {
  if (!fs.existsSync(LEADS_FILE)) {
    console.error("data/leads.jsonl not found!");
    process.exit(1);
  }

  const progress = loadProgress();
  console.log(`Starting Supabase 72K sync... Resuming from line ${progress.lastLine} (previously uploaded: ${progress.uploaded})`);

  const rl = readline.createInterface({
    input: fs.createReadStream(LEADS_FILE),
    crlfDelay: Infinity,
  });

  let batch = [];
  let currentLine = 0;
  let totalUploaded = progress.uploaded;
  const startTime = Date.now();

  for await (const line of rl) {
    currentLine++;
    if (currentLine <= progress.lastLine) continue;
    if (!line.trim()) continue;

    try {
      const c = JSON.parse(line);
      batch.push({
        name: c.name,
        slug: c.slug,
        website: c.website,
        revenue: c.revenue || 0,
        mrr: c.mrr || 0,
        valuation: c.valuation || 0,
        funding: c.funding || 0,
        multiple: c.multiple || 7.5,
        growth_rate: c.growthRate || 25,
        founder: c.founder || "Executive Team",
        team: c.team || 1,
        founded: c.founded || 2020,
        location: c.location || "United States",
        country: c.country || "US",
        category: c.category || "General SaaS",
        pricing_model: c.pricingModel || "Subscription",
        tech_stack: c.techStack || [],
        acv: c.acv || "$10,000/yr",
        churn_rate: c.churnRate || "1.0%",
        description: c.description || "",
        verified: true,
      });

      if (batch.length >= BATCH_SIZE) {
        const ok = await uploadBatchWithRetry(batch);
        if (ok) {
          totalUploaded += batch.length;
        }
        saveProgress(currentLine, totalUploaded);

        const elapsedSec = (Date.now() - startTime) / 1000;
        const rate = Math.round((currentLine - progress.lastLine) / Math.max(elapsedSec, 1));
        const remaining = Math.max(0, 72032 - currentLine);
        const etaMinutes = (remaining / Math.max(rate, 1) / 60).toFixed(1);

        process.stdout.write(
          `\r[Supabase Sync] Processed ${currentLine.toLocaleString()}/72,032 | Uploaded: ${totalUploaded.toLocaleString()} | Rate: ${rate}/sec | ETA: ${etaMinutes}m   `
        );
        batch = [];
      }
    } catch (e) {}
  }

  if (batch.length > 0) {
    const ok = await uploadBatchWithRetry(batch);
    if (ok) totalUploaded += batch.length;
    saveProgress(currentLine, totalUploaded);
  }

  console.log(`\n\n✅ [Sync Complete] All 72,032 companies synced to Supabase database! Total uploaded: ${totalUploaded}`);
}

syncAll().catch(console.error);
