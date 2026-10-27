export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://revatlas-one.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
