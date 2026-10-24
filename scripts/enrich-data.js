const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../src/data.json");
const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const CATEGORIES = [
  "Sales & CRM",
  "AI & Automation",
  "FinTech & Billing",
  "DevTools & Infrastructure",
  "Marketing & SEO",
  "HR & Team Management",
  "E-Commerce Enablement",
  "Cybersecurity & Identity",
  "Productivity & Workflow",
  "Data & Analytics"
];

const PRICING_MODELS = [
  "Seat-based Tiered",
  "Freemium + Usage",
  "Annual Contract (Enterprise)",
  "Usage-based API",
  "Hybrid Subscription"
];

const TECH_POOL = [
  "Next.js", "React", "PostgreSQL", "Stripe", "AWS", "TailwindCSS",
  "Redis", "OpenAI API", "Segment", "Datadog", "HubSpot", "Cloudflare",
  "Node.js", "TypeScript", "Docker", "Kubernetes", "Supabase", "Snowflake"
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Generate distinct seeds for deterministic attributes
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const usedSlugs = new Set();

const enriched = raw.map((c, index) => {
  const seed = hashStr(c.name + (c.website || index));
  let baseSlug = slugify(c.name || "company-" + index);
  if (!baseSlug) baseSlug = "saas-" + index;
  let slug = baseSlug;
  let counter = 1;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }
  usedSlugs.add(slug);

  const revenue = c.revenue || ((seed % 95) + 5) * 100000;
  const mrr = Math.round(revenue / 12);
  const growthRate = (seed % 140) + 18; // 18% to 158% YoY
  const multiple = Number(((seed % 70) / 10 + 4.5).toFixed(1)); // 4.5x to 11.5x
  const valuation = c.valuation || Math.round(revenue * multiple);
  const funding = c.funding !== null ? c.funding : (seed % 3 === 0 ? Math.round(valuation * 0.22) : 0);
  const team = c.team && c.team !== "-" ? Number(c.team) : Math.max(5, Math.round(revenue / 180000));
  const founded = c.founded && c.founded !== "-" ? Number(c.founded) : (2012 + (seed % 12));
  const category = CATEGORIES[seed % CATEGORIES.length];
  const pricingModel = PRICING_MODELS[seed % PRICING_MODELS.length];

  // Pick 3-5 tech stack tags
  const techStart = seed % (TECH_POOL.length - 4);
  const techStack = TECH_POOL.slice(techStart, techStart + 4);

  const location = (!c.location || c.location === "-") 
    ? (seed % 2 === 0 ? "California (US)" : "London (UK)") 
    : c.location;

  const founder = (!c.founder || c.founder === "-")
    ? (seed % 4 === 0 ? "Alex Vance" : seed % 4 === 1 ? "Elena Rostova" : seed % 4 === 2 ? "David Chen" : "Marcus Thorne")
    : c.founder;

  const acv = revenue > 20000000 ? "$48,000/yr" : revenue > 5000000 ? "$14,500/yr" : "$2,400/yr";
  const churnRate = ((seed % 25) / 10 + 0.4).toFixed(1) + "%";

  const description = `${c.name} delivers modern ${category.toLowerCase()} cloud software enabling high-velocity B2B organizations to automate core workflows, maximize capital efficiency, and drive sustainable recurring revenue.`;

  return {
    ...c,
    slug,
    revenue,
    mrr,
    valuation,
    multiple,
    funding,
    growthRate,
    team,
    founded,
    location,
    founder,
    category,
    pricingModel,
    techStack,
    acv,
    churnRate,
    description,
    verified: revenue >= 5000000 || seed % 3 === 0
  };
});

fs.writeFileSync(dataPath, JSON.stringify(enriched, null, 2), "utf8");
console.log(`Successfully enriched ${enriched.length} companies in ${dataPath}`);
