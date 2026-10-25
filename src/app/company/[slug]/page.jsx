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
  const revFormatted =
    company.revenue >= 1e9
      ? `$${(company.revenue / 1e9).toFixed(1)}B`
      : `$${(company.revenue / 1e6).toFixed(1)}M`;
  const title = `${company.name} Revenue, Valuation & Metrics (${revFormatted} ARR) — RevAtlas`;
  const description = `Verified SaaS metrics for ${company.name}: ${revFormatted} ARR, +${company.growthRate}% YoY growth, $${(company.valuation / 1e6).toFixed(0)}M valuation, ${company.founder} (Founder), team of ${company.team}. Free to search & export.`;
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
