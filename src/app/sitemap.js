import slugs from "../data/slugs.json";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://revatlas-one.vercel.app";
const CHUNK_SIZE = 40000;

export async function generateSitemaps() {
  const totalSitemaps = Math.max(1, Math.ceil(slugs.length / CHUNK_SIZE));
  return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }) {
  const sitemapId = Number(id) || 0;
  const start = sitemapId * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  const chunkSlugs = slugs.slice(start, end);

  const entries = [];

  // Core high-priority landing pages in sitemap 0
  if (sitemapId === 0) {
    entries.push(
      {
        url: `${BASE_URL}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${BASE_URL}/calculator`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/compare`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/pricing`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }
    );
  }

  for (const slug of chunkSlugs) {
    entries.push({
      url: `${BASE_URL}/company/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
