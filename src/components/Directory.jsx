"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import { showToast } from "./Toast";

function fmtMoney(v) {
  if (v == null) return "–";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${v}`;
}

const CATEGORY_TABS = [
  "All Sectors",
  "AI & Automation",
  "DevTools & Infrastructure",
  "FinTech & Billing",
  "Sales & CRM",
  "Marketing & SEO",
  "Productivity & Workflow",
  "Cybersecurity & Identity",
];

const COLS = [
  { key: "save", label: "Save" },
  { key: "compare", label: "Compare" },
  { key: "name", label: "Company" },
  { key: "category", label: "Sector" },
  { key: "revenue", label: "Revenue (ARR)" },
  { key: "growthRate", label: "Growth YoY" },
  { key: "valuation", label: "Valuation" },
  { key: "multiple", label: "Multiple" },
  { key: "founder", label: "Founder" },
  { key: "team", label: "Team" },
  { key: "location", label: "Location" },
];

export default function Directory({ data }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Sectors");
  const [country, setCountry] = useState("all");
  const [minRevenue, setMinRevenue] = useState("0");
  const [fundedOnly, setFundedOnly] = useState(false);
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");
  const [savedIds, setSavedIds] = useState([]);
  const [compareSlugs, setCompareSlugs] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("revatlas_saved_companies");
      if (stored) {
        setSavedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  function toggleSave(id, companyName) {
    let next;
    if (savedIds.includes(id)) {
      next = savedIds.filter((item) => item !== id);
      showToast(`Removed ${companyName} from watchlist`, "info");
    } else {
      next = [...savedIds, id];
      showToast(`Saved ${companyName} to customer watchlist!`, "success");
    }
    setSavedIds(next);
    localStorage.setItem("revatlas_saved_companies", JSON.stringify(next));
  }

  function toggleCompare(slug) {
    if (compareSlugs.includes(slug)) {
      setCompareSlugs(compareSlugs.filter((s) => s !== slug));
    } else {
      if (compareSlugs.length >= 3) {
        showToast("You can compare up to 3 companies simultaneously", "info");
        return;
      }
      const next = [...compareSlugs, slug];
      setCompareSlugs(next);
      if (next.length === 2) {
        showToast(`2 companies selected! Click 'Compare (2)' to benchmark`, "success");
      }
    }
  }

  const countries = useMemo(() => {
    const s = new Set();
    for (const d of data) if (d.location && d.location !== "-") s.add(d.location);
    return [...s].sort();
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data;
    if (selectedCategory !== "All Sectors") {
      rows = rows.filter((r) => r.category === selectedCategory);
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(needle) ||
          r.website?.toLowerCase().includes(needle) ||
          r.founder?.toLowerCase()?.includes(needle) ||
          r.category?.toLowerCase()?.includes(needle) ||
          r.location?.toLowerCase().includes(needle) ||
          r.techStack?.some((t) => t.toLowerCase().includes(needle))
      );
    }
    if (country !== "all") rows = rows.filter((r) => r.location === country);
    if (minRevenue !== "0") rows = rows.filter((r) => r.revenue && r.revenue >= Number(minRevenue));
    if (fundedOnly) rows = rows.filter((r) => r.funding && r.funding > 0);

    const dir = sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "name" || sortKey === "category") {
        av = (av || "").toLowerCase(); bv = (bv || "").toLowerCase();
        return av < bv ? -dir : av > bv ? dir : 0;
      }
      av = av ?? -1; bv = bv ?? -1;
      return (av - bv) * dir;
    });
    return rows;
  }, [data, q, selectedCategory, country, minRevenue, fundedOnly, sortKey, sortDir]);

  function exportCSV() {
    const header = ["Name", "Slug", "Website", "Sector", "ARR", "MRR", "YoYGrowth", "Valuation", "Multiple", "Funding", "Founder", "Team", "Location", "ACV", "TechStack"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push(
        [
          r.name, r.slug, r.website, r.category, r.revenue ?? "", r.mrr ?? "", `${r.growthRate}%`,
          r.valuation ?? "", `${r.multiple}x`, r.funding ?? "", r.founder ?? "", r.team ?? "",
          r.location ?? "", r.acv ?? "", r.techStack?.join(";") ?? ""
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `revatlas-leads-${filtered.length}.csv`;
    a.click();
    showToast(`Exported ${filtered.length} SaaS leads to CSV!`, "success");
  }

  function toggleSort(key) {
    if (key === "save" || key === "compare") return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const totalRev = filtered.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const fundedCount = filtered.filter((r) => r.funding && r.funding > 0).length;

  return (
    <div className="app-shell">
      <Navbar savedCount={savedIds.length} />

      <main className="container">
        {/* Hero Section */}
        <header className="hero-section">
          <div className="hero-badge">
            <span className="dot-pulse"></span> The Revenue & Lead Intelligence Atlas of SaaS
          </div>
          <h1 className="hero-title">Discover 72,000+ SaaS Companies by Revenue & Valuation</h1>
          <p className="hero-sub">
            The modern Bloomberg for SaaS. Explore verified ARR run-rates, valuation multiples, executive contacts, and tech stacks. Filter, bookmark to your customer workspace, and export verified leads.
          </p>

          {/* Quick Metrics Bar */}
          <div className="metrics-row">
            <div className="metric-card">
              <span className="metric-label">Companies Listed</span>
              <span className="metric-num">{filtered.length}</span>
              <span className="metric-foot">of {data.length} verified records</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Combined ARR</span>
              <span className="metric-num highlight">{fmtMoney(totalRev)}</span>
              <span className="metric-foot">filtered pipeline</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Funded Ventures</span>
              <span className="metric-num">{fundedCount}</span>
              <span className="metric-foot">{data.length - fundedCount} Bootstrapped</span>
            </div>
            <div className="metric-card highlight-card">
              <span className="metric-label">Valuation Calculator</span>
              <span className="metric-num">Engine ⚡</span>
              <Link href="/calculator" className="card-link">
                Calculate Valuation ↗
              </Link>
            </div>
          </div>
        </header>

        {/* Category Filter Pills Horizontal Bar */}
        <div className="category-tabs-bar">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Controls Panel */}
        <section className="filter-panel">
          <div className="filter-row">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by company, founder, tech stack (e.g. Stripe, AI), or city..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className="clear-btn" onClick={() => setQ("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="select-group">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="clean-select">
                <option value="all">🌐 All Locations</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select value={minRevenue} onChange={(e) => setMinRevenue(e.target.value)} className="clean-select">
                <option value="0">💰 Any Revenue</option>
                <option value="1000000">$1M+ ARR</option>
                <option value="5000000">$5M+ ARR</option>
                <option value="10000000">$10M+ ARR</option>
                <option value="50000000">$50M+ ARR</option>
              </select>

              <label className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={fundedOnly}
                  onChange={(e) => setFundedOnly(e.target.checked)}
                />
                <span>Funded Only</span>
              </label>

              {compareSlugs.length > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => router.push(`/compare?comp1=${compareSlugs[0]}&comp2=${compareSlugs[1] || ""}&comp3=${compareSlugs[2] || ""}`)}
                >
                  ⚖ Compare ({compareSlugs.length})
                </button>
              )}

              <button className="btn-primary" onClick={exportCSV}>
                ⬇ Export CSV ({filtered.length})
              </button>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="quick-tags">
            <span className="tag-label">Quick Filters:</span>
            <button
              className={`tag-chip ${minRevenue === "1000000" ? "active" : ""}`}
              onClick={() => setMinRevenue(minRevenue === "1000000" ? "0" : "1000000")}
            >
              🚀 $1M+ ARR Club
            </button>
            <button
              className={`tag-chip ${minRevenue === "10000000" ? "active" : ""}`}
              onClick={() => setMinRevenue(minRevenue === "10000000" ? "0" : "10000000")}
            >
              🏆 $10M+ Scaleups
            </button>
            <button
              className={`tag-chip ${fundedOnly ? "active" : ""}`}
              onClick={() => setFundedOnly(!fundedOnly)}
            >
              🦄 Venture Backed
            </button>
            {(q || selectedCategory !== "All Sectors" || country !== "all" || minRevenue !== "0" || fundedOnly) && (
              <button
                className="tag-chip tag-reset"
                onClick={() => {
                  setQ("");
                  setSelectedCategory("All Sectors");
                  setCountry("all");
                  setMinRevenue("0");
                  setFundedOnly(false);
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        </section>

        {/* Directory Table */}
        <div className="table-card">
          <table className="clean-table">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className={c.key !== "save" && c.key !== "compare" ? "sortable" : ""}
                    style={
                      c.key === "save" || c.key === "compare"
                        ? { width: "45px", textAlign: "center" }
                        : {}
                    }
                  >
                    {c.label} {sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const rowKey = r.slug || r.website || r.name;
                const isSaved = savedIds.includes(rowKey);
                const isCompared = compareSlugs.includes(r.slug);
                return (
                  <tr key={rowKey} className={isSaved ? "saved-row" : ""}>
                    {/* Save Button */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className={`star-btn ${isSaved ? "starred" : ""}`}
                        onClick={() => toggleSave(rowKey, r.name)}
                        title={isSaved ? "Remove from Watchlist" : "Save to Customer Watchlist"}
                      >
                        {isSaved ? "★" : "☆"}
                      </button>
                    </td>

                    {/* Compare Checkbox */}
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(r.slug)}
                        title="Select to compare side-by-side"
                        className="compare-chk"
                      />
                    </td>

                    {/* Company Name & Link to Profile */}
                    <td>
                      <div className="company-title-cell">
                        <Link href={`/company/${r.slug}`} className="cname-link">
                          <span className="cname">{r.name}</span>
                          {r.verified && <span className="verified-dot" title="Verified SaaS">✓</span>}
                        </Link>
                        {r.website && (
                          <a
                            className="site-link"
                            href={`https://${r.website}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.website} ↗
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td><span className="pill-neutral">{r.category}</span></td>

                    {/* Revenue */}
                    <td>
                      <span className="rev-badge">{fmtMoney(r.revenue)}</span>
                    </td>

                    {/* YoY Growth */}
                    <td>
                      <span style={{ color: "var(--green)", fontWeight: 700 }}>
                        +{r.growthRate}%
                      </span>
                    </td>

                    {/* Valuation */}
                    <td>{fmtMoney(r.valuation)}</td>

                    {/* Multiple */}
                    <td>
                      <span className="pill-neutral">{r.multiple}x</span>
                    </td>

                    {/* Founder */}
                    <td>
                      <span className="founder-name">{r.founder ?? "–"}</span>
                    </td>

                    {/* Team */}
                    <td>
                      {r.team ? <span className="team-pill">{r.team} team</span> : "–"}
                    </td>

                    {/* Location */}
                    <td>{r.location && r.location !== "-" ? r.location : "–"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLS.length} className="empty-state">
                    <div className="empty-msg">
                      <p>No SaaS companies found matching your criteria.</p>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          setQ("");
                          setSelectedCategory("All Sectors");
                          setCountry("all");
                          setMinRevenue("0");
                          setFundedOnly(false);
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Social Proof & Customer Reviews Banner */}
        <section className="social-proof-banner">
          <div className="proof-heading">
            <h3>Trusted by 14,000+ Founders, VCs, and Sales Leaders</h3>
            <p>Here's how growth teams use RevAtlas intelligence daily:</p>
          </div>
          <div className="reviews-grid">
            <div className="review-card">
              <p className="review-quote">
                "RevAtlas replaced our $6,000/yr ZoomInfo subscription. The ARR estimates and verified founder contacts allowed us to close 3 enterprise pilots in week one."
              </p>
              <div className="reviewer-info">
                <b>Marcus Thorne</b>
                <span>VP Sales, HyperScale Cloud</span>
              </div>
            </div>

            <div className="review-card">
              <p className="review-quote">
                "The Valuation Calculator and side-by-side benchmarking tool give our investment committee instant clarity on market multiples before making term sheet offers."
              </p>
              <div className="reviewer-info">
                <b>Elena Rostova</b>
                <span>Partner, Horizon Ventures</span>
              </div>
            </div>

            <div className="review-card">
              <p className="review-quote">
                "Claiming our profile took 2 minutes. We now receive inbound partnership inquiries from other SaaS founders every week directly through RevAtlas."
              </p>
              <div className="reviewer-info">
                <b>Carl Turner</b>
                <span>Founder, SwipeBy</span>
              </div>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="page-footer">
          <div className="footer-left">
            <span>RevAtlas 🌍 · The Revenue Atlas of SaaS</span>
            <span className="footer-sep">·</span>
            <span>Data verified via public SEC filings & verified founder index</span>
          </div>
          <div className="footer-right">
            <Link href="/compare">Compare Engine</Link>
            <Link href="/calculator">Valuation Calculator</Link>
            <Link href="/pricing">Pricing Plans</Link>
            <Link href="/dashboard?tab=api">REST API</Link>
            <Link href="/dashboard?tab=claim">Claim SaaS</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
