const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdbnwxqwupjepyatesyw.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_H8jleixzDsGwglnxl6_L1A_yu7M1yZO";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Connecting to Supabase at:", supabaseUrl);

  const dataPath = path.join(__dirname, "../src/data.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const companies = JSON.parse(raw);

  console.log(`Loaded ${companies.length} initial companies from data.json`);

  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < companies.length; i += batchSize) {
    const chunk = companies.slice(i, i + batchSize).map((c) => ({
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
    }));

    const { data, error } = await supabase.from("companies").upsert(chunk, { onConflict: "slug" });
    if (error) {
      console.error(`Error inserting chunk ${i}-${i + chunk.length}:`, error.message);
    } else {
      inserted += chunk.length;
      console.log(`Successfully synced ${inserted}/${companies.length} companies to Supabase`);
    }
  }

  console.log("Finished syncing initial database to Supabase!");
}

seed().catch(console.error);
