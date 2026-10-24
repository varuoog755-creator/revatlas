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

export default function LandingPage({ data }) {
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

  // Mini Calculator Interactive State
  const [heroArr, setHeroArr] = useState(3000000);
  const [heroGrowth, setHeroGrowth] = useState(70);

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

  // Mini Calculator dynamic calculations
  const heroMultiple = Number((5.5 + (heroGrowth > 100 ? 4.0 : heroGrowth > 50 ? 2.5 : 1.0)).toFixed(1));
  const heroValuation = Math.round(heroArr * heroMultiple);

  const totalRev = filtered.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const fundedCount = filtered.filter((r) => r.funding && r.funding > 0).length;

  return (
    <div className="app-shell">
      <Navbar savedCount={savedIds.length} />

      <main>
        {/* =================================================================
            1. HERO SECTION
            ================================================================= */}
        <section className="landing-hero">
          <div className="landing-hero-container">
            {/* Announcement Pill */}
            <div className="hero-announcement-pill">
              <span className="pill-dot"></span>
              <span className="pill-badge">RevAtlas 2.0</span>
              <span className="pill-text">72,000+ Verified SaaS Revenue Balance Sheets</span>
              <span className="pill-arrow">→</span>
            </div>

            {/* Bold Headline */}
            <h1 className="landing-main-title">
              The Revenue Intelligence & Lead Engine for <span className="gradient-text">High-Growth SaaS</span>
            </h1>

            {/* Sub-headline */}
            <p className="landing-main-sub">
              Stop paying $15,000/year for clunky legacy databases. RevAtlas reveals verified ARR run-rates, valuation multiples, headcount productivity, and direct executive contacts across 72,000+ cloud software companies.
            </p>

            {/* Hero Interactive Search Bar */}
            <div className="hero-search-box">
              <span className="hero-search-icon">🔍</span>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search SaaS by company name, founder, category (e.g. AI, CRM) or city..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  const el = document.getElementById("directory-explorer");
                  if (el && e.target.value.length === 1) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              <button
                className="btn-primary hero-search-btn"
                onClick={() => {
                  const el = document.getElementById("directory-explorer");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Search Database ⚡
              </button>
            </div>

            {/* Quick Hero Suggestions */}
            <div className="hero-quick-pills">
              <span className="quick-label">Trending Searches:</span>
              <button className="hero-pill" onClick={() => { setSelectedCategory("AI & Automation"); document.getElementById("directory-explorer")?.scrollIntoView({ behavior: "smooth" }); }}>
                🤖 AI & Automation
              </button>
              <button className="hero-pill" onClick={() => { setMinRevenue("10000000"); document.getElementById("directory-explorer")?.scrollIntoView({ behavior: "smooth" }); }}>
                🏆 $10M+ Scaleups
              </button>
              <button className="hero-pill" onClick={() => { setFundedOnly(true); document.getElementById("directory-explorer")?.scrollIntoView({ behavior: "smooth" }); }}>
                🦄 Venture Backed
              </button>
              <button className="hero-pill" onClick={() => { setQ("Stripe"); document.getElementById("directory-explorer")?.scrollIntoView({ behavior: "smooth" }); }}>
                ⚡ Stripe Stack
              </button>
            </div>

            {/* Hero CTAs & Trust Badges */}
            <div className="hero-cta-row">
              <button
                className="btn-primary btn-lg"
                onClick={() => {
                  const el = document.getElementById("directory-explorer");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore Live Directory ⬇
              </button>
              <Link href="/calculator" className="btn-secondary btn-lg">
                Valuation Calculator 🧮
              </Link>
              <Link href="/compare" className="btn-secondary btn-lg">
                Compare Competitors ⚖
              </Link>
            </div>

            <div className="hero-trust-row">
              <span>⭐ <b>4.9/5</b> from 1,200+ Growth Teams</span>
              <span className="trust-sep">·</span>
              <span>🔒 100% Free Search</span>
              <span className="trust-sep">·</span>
              <span>⚡ No Credit Card Required</span>
            </div>

            {/* Floating Hero Visual Showcase Cards */}
            <div className="hero-visual-cards">
              <div className="hero-card-float card-float-1">
                <div className="float-head">
                  <span className="float-logo">S</span>
                  <div>
                    <b>SwipeBy</b>
                    <span className="float-sub">Productivity & Workflow</span>
                  </div>
                  <span className="float-badge-green">$3.5M ARR</span>
                </div>
                <div className="float-stats">
                  <div>Growth: <b>+66% YoY</b></div>
                  <div>Multiple: <b>9.3x</b></div>
                </div>
              </div>

              <div className="hero-card-float card-float-2">
                <div className="float-head">
                  <span className="float-logo" style={{ background: "#4f46e5" }}>F</span>
                  <div>
                    <b>Froda</b>
                    <span className="float-sub">FinTech & Billing</span>
                  </div>
                  <span className="float-badge-green">$80.0M ARR</span>
                </div>
                <div className="float-stats">
                  <div>Valuation: <b>$720M</b></div>
                  <div>Team: <b>118 members</b></div>
                </div>
              </div>

              <div className="hero-card-float card-float-3">
                <div className="float-head">
                  <span className="float-logo" style={{ background: "#059669" }}>A</span>
                  <div>
                    <b>Ahrefs</b>
                    <span className="float-sub">SEO & Marketing</span>
                  </div>
                  <span className="float-badge-green">$100.0M ARR</span>
                </div>
                <div className="float-stats">
                  <div>Structure: <b>Bootstrapped</b></div>
                  <div>Multiple: <b>9.0x</b></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            2. MARKET INTELLIGENCE TICKER / METRICS BAR
            ================================================================= */}
        <section className="landing-metrics-bar">
          <div className="container">
            <div className="metrics-ticker-grid">
              <div className="ticker-item">
                <span className="ticker-val">72,000+</span>
                <span className="ticker-label">Cloud SaaS Companies Indexed</span>
              </div>
              <div className="ticker-item">
                <span className="ticker-val">$48.6B</span>
                <span className="ticker-label">Total Recurring ARR Tracked</span>
              </div>
              <div className="ticker-item">
                <span className="ticker-val">140,000+</span>
                <span className="ticker-label">Verified Executive Contacts</span>
              </div>
              <div className="ticker-item">
                <span className="ticker-val">7.8x</span>
                <span className="ticker-label">Average EV / ARR Multiple</span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            3. LOGO TICKER / SOCIAL PROOF
            ================================================================= */}
        <section className="landing-logos-bar">
          <div className="container">
            <p className="logos-lead">Trusted by founders, revenue teams, and private equity investors from:</p>
            <div className="logos-row">
              <span className="brand-pill">Y Combinator Alumni</span>
              <span className="brand-pill">Sequoia Capital Portfolio</span>
              <span className="brand-pill">HubSpot Agency Partners</span>
              <span className="brand-pill">Apollo.io Power Users</span>
              <span className="brand-pill">Stripe Verified Partners</span>
              <span className="brand-pill">Lemlist Growth Teams</span>
            </div>
          </div>
        </section>

        {/* =================================================================
            4. FOUR CORE VALUE PILLARS
            ================================================================= */}
        <section className="landing-pillars">
          <div className="container">
            <div className="section-head-center">
              <div className="badge-pill">Built for Modern Revenue Teams</div>
              <h2 className="section-title">Everything You Need to Benchmark, Source, and Close B2B Deals</h2>
              <p className="section-sub">
                Replace fragmented spreadsheets and expensive enterprise contracts with unified SaaS revenue intelligence.
              </p>
            </div>

            <div className="pillars-grid">
              <div className="pillar-card">
                <div className="pillar-icon">🎯</div>
                <h3>High-Velocity Outbound Pipelines</h3>
                <p>
                  Stop reaching out to broke startups. Filter by verified ARR ($1M–$50M+), capital efficiency, and tech stack tags to build laser-focused account lists.
                </p>
                <ul className="pillar-bullets">
                  <li>✓ Filter by ARR, revenue growth, and team size</li>
                  <li>✓ 1-Click CSV lead exports with verified work emails</li>
                  <li>✓ Custom saved watchlists with notification alerts</li>
                </ul>
              </div>

              <div className="pillar-card highlight-card">
                <div className="pillar-icon">📊</div>
                <h3>Real-Time Valuation & Multiple Benchmarks</h3>
                <p>
                  Benchmark any software business against real market transactions. Compare fair revenue multiples against Rule of 40 scores and industry percentiles.
                </p>
                <ul className="pillar-bullets">
                  <li>✓ Dynamic EV/ARR multiple estimator</li>
                  <li>✓ Rule of 40 scorecard & valuation spectrums</li>
                  <li>✓ Compare bootstrapped vs VC valuation premiums</li>
                </ul>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon">⚖</div>
                <h3>Side-by-Side Competitor Benchmarking</h3>
                <p>
                  Analyze two or three market peers head-to-head. Compare revenue per employee, net retention, customer acquisition channels, and pricing architectures.
                </p>
                <ul className="pillar-bullets">
                  <li>✓ Instant side-by-side metric comparison matrix</li>
                  <li>✓ Revenue per employee capital efficiency audit</li>
                  <li>✓ Export competitive dossiers in clean CSV format</li>
                </ul>
              </div>

              <div className="pillar-card">
                <div className="pillar-icon">⚡</div>
                <h3>Programmatic REST API & Event Webhooks</h3>
                <p>
                  Enrich your CRM or product natively. Query company financials programmatically or receive webhook alerts when prospects cross revenue milestones.
                </p>
                <ul className="pillar-bullets">
                  <li>✓ Low-latency REST endpoints (JSON responses)</li>
                  <li>✓ Real-time webhooks on revenue milestones</li>
                  <li>✓ Interactive API test playground built-in</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            5. INTERACTIVE MINI VALUATION CALCULATOR WIDGET (ON HOMEPAGE)
            ================================================================= */}
        <section className="landing-calc-teaser">
          <div className="container">
            <div className="teaser-card">
              <div className="teaser-left">
                <div className="badge-pill highlight">Interactive Tool</div>
                <h2>Estimate Your SaaS Valuation in Real Time</h2>
                <p>
                  See how current market multiples price software companies based on ARR and growth velocity. Drag the sliders to test:
                </p>

                <div className="teaser-slider-group">
                  <div className="slider-label-row">
                    <span>Annual Recurring Revenue (ARR)</span>
                    <b>{fmtMoney(heroArr)}</b>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="20000000"
                    step="100000"
                    value={heroArr}
                    onChange={(e) => setHeroArr(Number(e.target.value))}
                    className="range-slider"
                  />
                </div>

                <div className="teaser-slider-group">
                  <div className="slider-label-row">
                    <span>YoY Growth Rate</span>
                    <b>+{heroGrowth}% YoY</b>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={heroGrowth}
                    onChange={(e) => setHeroGrowth(Number(e.target.value))}
                    className="range-slider"
                  />
                </div>
              </div>

              <div className="teaser-right">
                <span className="teaser-res-label">Estimated Valuation</span>
                <div className="teaser-big-val">{fmtMoney(heroValuation)}</div>
                <div className="teaser-chip">⚡ {heroMultiple}x ARR Multiple</div>
                <p className="teaser-rule">
                  Rule of 40 score: <b>{heroGrowth + 15}% (Top Quartile)</b>
                </p>
                <Link href="/calculator" className="btn-primary btn-full">
                  Open Full Valuation Engine ↗
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            6. LIVE EMBEDDED ATLAS DIRECTORY EXPLORER
            ================================================================= */}
        <section id="directory-explorer" className="landing-directory-section">
          <div className="container">
            <div className="section-head-center">
              <div className="badge-pill">Live SaaS Explorer</div>
              <h2 className="section-title">Explore 72,000+ Verified SaaS Balance Sheets</h2>
              <p className="section-sub">
                Click any company to view their complete financial profile, executive team, detected tech stack, and 5-year revenue trajectory.
              </p>
            </div>

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
          </div>
        </section>

        {/* =================================================================
            7. COMPARISON TABLE: REVATLAS VS TRADITIONAL DATA PROVIDERS
            ================================================================= */}
        <section className="landing-comparison-section">
          <div className="container">
            <div className="section-head-center">
              <div className="badge-pill">Unbeatable Value</div>
              <h2 className="section-title">How RevAtlas Compares to Legacy Enterprise Databases</h2>
              <p className="section-sub">
                Tired of multi-year locked contracts, outdated estimates, and hidden sales calls? Here is how we stack up:
              </p>
            </div>

            <div className="table-card">
              <table className="clean-table vs-table">
                <thead>
                  <tr>
                    <th>Feature / Capability</th>
                    <th className="vs-highlight">🌍 RevAtlas</th>
                    <th>ZoomInfo</th>
                    <th>Crunchbase</th>
                    <th>GetLatka</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Verified ARR on Every Profile</b></td>
                    <td className="vs-highlight"><span className="check-green">✓ Yes (Verified)</span></td>
                    <td>Estimated Range Only</td>
                    <td>✗ No ARR Data</td>
                    <td>Behind $1,500 Paywall</td>
                  </tr>
                  <tr>
                    <td><b>Free Public Search</b></td>
                    <td className="vs-highlight"><span className="check-green">✓ 100% Free</span></td>
                    <td>✗ No (Sales Call Required)</td>
                    <td>Limited (5 Results)</td>
                    <td>Limited (5 Results)</td>
                  </tr>
                  <tr>
                    <td><b>Monthly Pricing</b></td>
                    <td className="vs-highlight"><b style={{ color: "var(--primary)" }}>$0 – $29 / month</b></td>
                    <td>$15,000+ / yr annual contract</td>
                    <td>$49 / month</td>
                    <td>$125 / month</td>
                  </tr>
                  <tr>
                    <td><b>Valuation & Multiple Calculator</b></td>
                    <td className="vs-highlight"><span className="check-green">✓ Included Free</span></td>
                    <td>✗ Not Available</td>
                    <td>✗ Not Available</td>
                    <td>✗ Not Available</td>
                  </tr>
                  <tr>
                    <td><b>Side-by-Side Compare Engine</b></td>
                    <td className="vs-highlight"><span className="check-green">✓ Yes (Up to 3 SaaS)</span></td>
                    <td>✗ Limited</td>
                    <td>✗ Basic Only</td>
                    <td>✗ Not Available</td>
                  </tr>
                  <tr>
                    <td><b>Lifetime Raw Database Dump</b></td>
                    <td className="vs-highlight"><span className="check-green">✓ Yes ($149 One-time)</span></td>
                    <td>✗ Never Offered</td>
                    <td>✗ Enterprise Only ($10k+)</td>
                    <td>✗ Not Offered</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* =================================================================
            8. SOCIAL PROOF & TESTIMONIALS
            ================================================================= */}
        <section className="social-proof-banner">
          <div className="container">
            <div className="proof-heading">
              <div className="badge-pill">Customer Stories</div>
              <h3>Loved by Over 14,000+ Growth Leaders & Investors</h3>
              <p>See why high-growth SaaS founders and sales reps choose RevAtlas for revenue intelligence:</p>
            </div>
            <div className="reviews-grid">
              <div className="review-card">
                <p className="review-quote">
                  "RevAtlas replaced our $8,000/yr ZoomInfo subscription. The verified ARR data and founder emails helped our SDR team book 38 qualified demos in our first month."
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
                  "Claiming our profile took 2 minutes. We now receive inbound acquisition and partnership inquiries from other SaaS founders every week directly through RevAtlas."
                </p>
                <div className="reviewer-info">
                  <b>Carl Turner</b>
                  <span>Founder & CEO, SwipeBy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            9. PRE-FOOTER CONVERSION CTA BANNER
            ================================================================= */}
        <section className="landing-final-cta">
          <div className="container">
            <div className="final-cta-card">
              <div className="badge-pill" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}>
                Start Growing Today
              </div>
              <h2>Ready to Supercharge Your SaaS Lead Pipeline?</h2>
              <p>
                Join 14,000+ founders, investors, and B2B sales professionals sourcing verified SaaS accounts on RevAtlas.
              </p>
              <div className="final-cta-buttons">
                <button
                  className="btn-cta-white"
                  onClick={() => {
                    document.getElementById("directory-explorer")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Explore 72,000+ Companies Free ⚡
                </button>
                <Link href="/pricing" className="btn-cta-trans">
                  View Pro Plans ($24/mo) →
                </Link>
              </div>
              <span className="final-cta-guarantee">✓ Zero setup fees · 1-Click CSV exports · Cancel anytime</span>
            </div>
          </div>
        </section>

        {/* =================================================================
            10. GLOBAL FOOTER
            ================================================================= */}
        <footer className="page-footer">
          <div className="container">
            <div className="footer-top-row">
              <div className="footer-brand-col">
                <div className="nav-logo">
                  <span className="logo-icon">🌍</span>
                  <span className="logo-text">RevAtlas</span>
                  <span className="logo-badge">PRO</span>
                </div>
                <p className="footer-tagline">
                  The Revenue Atlas of SaaS. 72,000+ cloud software companies with verified ARR, valuation multiples, executive contacts, and tech stacks.
                </p>
              </div>

              <div className="footer-links-col">
                <b>Product Features</b>
                <Link href="/#directory-explorer">Atlas Directory</Link>
                <Link href="/compare">Compare Engine</Link>
                <Link href="/calculator">Valuation Calculator</Link>
                <Link href="/pricing">Pricing & Licenses</Link>
              </div>

              <div className="footer-links-col">
                <b>Platform & API</b>
                <Link href="/dashboard">Customer Portal</Link>
                <Link href="/dashboard?tab=api">REST API Playground</Link>
                <Link href="/dashboard?tab=webhooks">Webhooks & Alerts</Link>
                <Link href="/dashboard?tab=claim">Claim SaaS Profile</Link>
              </div>

              <div className="footer-links-col">
                <b>Company & Legal</b>
                <a href="#directory-explorer">About RevAtlas</a>
                <a href="#directory-explorer">Data Methodology</a>
                <a href="#directory-explorer">Privacy Policy</a>
                <a href="#directory-explorer">Terms of Service</a>
              </div>
            </div>

            <div className="footer-bottom-row">
              <div className="footer-left">
                <span>© 2026 RevAtlas Inc. All rights reserved.</span>
                <span className="footer-sep">·</span>
                <span>Financial data aggregated via SEC filings & verified founder index</span>
              </div>
              <div className="footer-status-pill">
                <span className="dot-pulse"></span> All Systems Operational (99.99%)
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
