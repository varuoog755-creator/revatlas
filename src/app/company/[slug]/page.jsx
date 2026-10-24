import data from "../../../data.json";
import CompanyProfileView from "../../../components/CompanyProfileView";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return data.map((c) => ({
    slug: c.slug,
  }));
}

export function generateMetadata({ params }) {
  const company = data.find((c) => c.slug === params.slug);
  if (!company) {
    return { title: "Company Not Found — RevAtlas" };
  }
  return {
    title: `${company.name} Revenue, Valuation & Metrics ($${(company.revenue / 1e6).toFixed(1)}M ARR) — RevAtlas`,
    description: `Detailed SaaS metrics for ${company.name}: $${(company.revenue / 1e6).toFixed(1)}M ARR, ${company.growthRate}% YoY growth, valuation multiple, team size, and founder contacts.`,
  };
}

export default function CompanyPage({ params }) {
  const company = data.find((c) => c.slug === params.slug);
  if (!company) {
    notFound();
  }

  // Find 3 similar peers in the same category or ARR range
  const peers = data
    .filter((c) => c.slug !== company.slug && (c.category === company.category || Math.abs(c.revenue - company.revenue) < 5000000))
    .slice(0, 3);

  return <CompanyProfileView company={company} peers={peers} />;
}
