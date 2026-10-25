const https = require("https");

function fetchPage(page) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://getlatka.com/saas-companies?page=${page}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    ).on("error", reject);
  });
}

function parseMoney(str) {
  if (!str || str === "-" || str === "N/A") return null;
  const s = str.replace(/[$,]/g, "").trim().toUpperCase();
  if (s.endsWith("B")) return Math.round(parseFloat(s) * 1e9);
  if (s.endsWith("M")) return Math.round(parseFloat(s) * 1e6);
  if (s.endsWith("K")) return Math.round(parseFloat(s) * 1e3);
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n);
}

function parseTableRows(html) {
  // In Next.js SSR / flight stream, rows have <tr class="align-middle">...</tr>
  const rows = [];
  const trMatches = html.match(/<tr class="align-middle">[\s\S]*?<\/tr>/g) || [];

  for (const tr of trMatches) {
    // Extract company link & name: href="/companies/([^"]+)"[^>]*>([^<]+)<\/a>
    const compMatch = tr.match(/href="\/companies\/([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (!compMatch) continue;
    const slug = compMatch[1].replace(/\.com$/, "");
    const name = compMatch[2].trim();

    // Extract all <td> cells
    const tds = (tr.match(/<td[\s\S]*?<\/td>/g) || []).map((td) => {
      return td.replace(/<[^>]+>/g, "").trim();
    });

    if (tds.length >= 8) {
      // Columns: [0: Name, 1: Website, 2: Revenue, 3: Funding, 4: Valuation, 5: Founder, 6: Team, 7: Founded, 8: Location, 9: Updated]
      const website = tds[1] || "";
      const revRaw = tds[2] || "";
      const fundingRaw = tds[3] || "";
      const valRaw = tds[4] || "";
      const founder = tds[5] || "";
      const teamRaw = tds[6] || "";
      const foundedRaw = tds[7] || "";
      const location = tds[8] || "";

      rows.push({
        name,
        slug,
        website,
        revenue: parseMoney(revRaw),
        funding: parseMoney(fundingRaw),
        valuation: parseMoney(valRaw),
        founder: founder === "-" ? null : founder,
        team: parseInt(teamRaw) || null,
        founded: parseInt(foundedRaw) || null,
        location: location === "-" ? null : location,
      });
    }
  }
  return rows;
}

async function run() {
  const html = await fetchPage(1);
  const parsed = parseTableRows(html);
  console.log("Parsed rows count on page 1:", parsed.length);
  console.log("First 3 companies:", JSON.stringify(parsed.slice(0, 3), null, 2));
}

run();
