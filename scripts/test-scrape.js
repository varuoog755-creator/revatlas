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

async function main() {
  console.log("Fetching page 2...");
  const html = await fetchPage(2);
  console.log("HTML length:", html.length);
  const companyLinks = html.match(/\/companies\/[a-zA-Z0-9.-]+/g);
  console.log("Found company links:", [...new Set(companyLinks || [])].slice(0, 15));
}

main();
