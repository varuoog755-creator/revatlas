import data from "../../../data.json";
import CompanyProfileView from "../../../components/CompanyProfileView";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export const dynamicParams = true;

export function generateStaticParams() {
  return data.map((c) => ({
    slug: c.slug,
  }));
}

function normalizeCompany(c) {
  if (!c) return null;
  return {
    ...c,
    growthRate: c.growthRate ?? c.growth_rate ?? 25,
    pricingModel: c.pricingModel ?? c.pricing_model ?? "Subscription",
    techStack: c.techStack ?? c.tech_stack ?? ["Cloud", "Stripe", "PostgreSQL"],
    churnRate: c.churnRate ?? c.churn_rate ?? "1.0%",
  };
}

async function getCompany(slug) {
  // 1. Check local static dataset
  const local = data.find((c) => c.slug === slug);
  if (local) return normalizeCompany(local);

  // 2. Query Supabase (72,000+ companies)
  try {
    const { data: dbCompany, error } = await supabase
      .from("companies")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && dbCompany) {
      return normalizeCompany(dbCompany);
    }
  } catch (e) {
    console.error("Error fetching company from Supabase:", e);
  }

  return null;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const company = await getCompany(slug);

  if (!company) {
    return { title: "Company Not Found — RevAtlas" };
  }

  const revFormatted =
    company.revenue >= 1e9
      ? `$${(company.revenue / 1e9).toFixed(1)}B`
      : `$${(company.revenue / 1e6).toFixed(1)}M`;

  const title = `${company.name} Revenue, Valuation & Metrics (${revFormatted} ARR) — RevAtlas`;
  const description = `Verified SaaS metrics for ${company.name}: ${revFormatted} ARR, +${company.growthRate}% YoY growth, $${((company.valuation || 0) / 1e6).toFixed(0)}M valuation, ${company.founder} (Founder), team of ${company.team}. Free to search & export.`;
  const url = `https://revatlas-one.vercel.app/company/${company.slug}`;
  const cleanDomain = (company.website || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  const logo = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "RevAtlas — The Revenue Atlas of SaaS",
      images: [
        {
          url: logo,
          width: 128,
          height: 128,
          alt: `${company.name} logo`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [logo],
    },
  };
}

export default async function CompanyPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const company = await getCompany(slug);

  if (!company) {
    notFound();
  }

  // Find 3 similar peers in the same category or ARR range
  let peers = data
    .filter((c) => c.slug !== company.slug && (c.category === company.category || Math.abs(c.revenue - company.revenue) < 10000000))
    .slice(0, 3);

  // If local peers are empty, fallback to first 3 local companies
  if (peers.length === 0) {
    peers = data.filter((c) => c.slug !== company.slug).slice(0, 3);
  }

  return <CompanyProfileView company={company} peers={peers} />;
}
