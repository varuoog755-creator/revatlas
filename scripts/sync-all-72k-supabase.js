const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdbnwxqwupjepyatesyw.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_H8jleixzDsGwglnxl6_L1A_yu7M1yZO";

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAll() {
  const filePath = path.join(__dirname, "../data/leads.jsonl");
  if (!fs.existsSync(filePath)) {
    console.error("data/leads.jsonl not found!");
    process.exit(1);
  }

  console.log("Starting streaming sync of 72,000+ companies to Supabase...");
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let batch = [];
  let totalProcessed = 0;
  let totalUploaded = 0;
  const BATCH_SIZE = 100;

  for await (const line of rl) {
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

      totalProcessed++;

      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase.from("companies").upsert(batch, { onConflict: "slug" });
        if (error) {
          console.error(`Batch upload error around record ${totalProcessed}:`, error.message);
        } else {
          totalUploaded += batch.length;
          process.stdout.write(`\r[Supabase Sync] Uploaded ${totalUploaded} companies to Supabase...`);
        }
        batch = [];
      }
    } catch (e) {
      // skip invalid lines
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase.from("companies").upsert(batch, { onConflict: "slug" });
    if (!error) totalUploaded += batch.length;
  }

  console.log(`\n✅ Finished! Successfully synced ${totalUploaded} companies to Supabase.`);
}

syncAll().catch(console.error);
