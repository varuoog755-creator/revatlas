"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import { showToast } from "./Toast";
import CompanyLogo from "./CompanyLogo";

function fmtMoney(v) {
  if (v == null) return "–";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${v}`;
}

function normalizeCompany(c) {
  if (!c) return null;
  return {
    ...c,
    revenue: c.revenue || 0,
    mrr: c.mrr || Math.round((c.revenue || 0) / 12),
    valuation: c.valuation || 0,
    multiple: c.multiple || 7.5,
    growthRate: c.growthRate ?? c.growth_rate ?? 25,
    pricingModel: c.pricingModel ?? c.pricing_model ?? "Subscription",
    techStack: c.techStack ?? c.tech_stack ?? ["Cloud", "Stripe"],
    churnRate: c.churnRate ?? c.churn_rate ?? "1.0%",
    funding: c.funding || 0,
    team: c.team || 1,
    founder: c.founder || "Executive Team",
    location: c.location || "United States",
  };
}

export default function CompareTool({ data }) {
  const [companiesList, setCompaniesList] = useState(() => data.map(normalizeCompany));
  const [comp1Slug, setComp1Slug] = useState(data[0]?.slug || "swipeby");
  const [comp2Slug, setComp2Slug] = useState(data[1]?.slug || "froda");
  const [comp3Slug, setComp3Slug] = useState(data[2]?.slug || "ahrefs");
  const [showThird, setShowThird] = useState(false);

  // Search picker state for swapping a slot
  const [searchTargetSlot, setSearchTargetSlot] = useState(null); // 1, 2, or 3
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load requested slugs from URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const c1 = p.get("comp1");
      const c2 = p.get("comp2");
      const c3 = p.get("comp3");

      const loadMissing = async (slug, setter, isThird = false) => {
        if (!slug) return;
        setter(slug);
        if (isThird) setShowThird(true);

        // If not already in companiesList, fetch from /api/companies
        const exists = companiesList.some((d) => d.slug === slug);
        if (!exists) {
          try {
            const res = await fetch(`/api/companies?search=${encodeURIComponent(slug)}&limit=1`);
            const json = await res.json();
            if (json && json.data && json.data.length > 0) {
              const fetched = normalizeCompany(json.data[0]);
              setCompaniesList((prev) => [fetched, ...prev]);
            }
          } catch (e) {
            console.error("Error loading company from 72K DB:", e);
          }
        }
      };

      if (c1) loadMissing(c1, setComp1Slug);
      if (c2) loadMissing(c2, setComp2Slug);
      if (c3) loadMissing(c3, setComp3Slug, true);
    }
  }, []);

  // Handle autocomplete search across 72,000+ companies
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/companies?search=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setSearchResults(json.data.map(normalizeCompany));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function selectCompanyForSlot(company, slot) {
    setCompaniesList((prev) => {
      if (prev.some((c) => c.slug === company.slug)) return prev;
      return [company, ...prev];
    });

    if (slot === 1) setComp1Slug(company.slug);
    if (slot === 2) setComp2Slug(company.slug);
    if (slot === 3) {
      setComp3Slug(company.slug);
      setShowThird(true);
    }

    setSearchTargetSlot(null);
    setSearchQuery("");
    setSearchResults([]);
    showToast(`Loaded ${company.name} into comparison matrix!`, "success");
  }

  const c1 = companiesList.find((d) => d.slug === comp1Slug) || companiesList[0] || {};
  const c2 = companiesList.find((d) => d.slug === comp2Slug) || companiesList[1] || {};
  const c3 = companiesList.find((d) => d.slug === comp3Slug) || companiesList[2] || {};

  const activeCompanies = showThird ? [c1, c2, c3] : [c1, c2];

  function exportComparisonCSV() {
    const rows = [
      ["Metric", ...activeCompanies.map((c) => c.name)],
      ["ARR (Annual)", ...activeCompanies.map((c) => `$${c.revenue}`)],
      ["MRR (Monthly)", ...activeCompanies.map((c) => `$${c.mrr}`)],
      ["Estimated Valuation", ...activeCompanies.map((c) => `$${c.valuation}`)],
      ["Valuation Multiple", ...activeCompanies.map((c) => `${c.multiple}x`)],
      ["YoY Growth Rate", ...activeCompanies.map((c) => `${c.growthRate}%`)],
      ["Total Capital Raised", ...activeCompanies.map((c) => `$${c.funding}`)],
      ["Team Size", ...activeCompanies.map((c) => `${c.team} employees`)],
      ["ARR Per Employee", ...activeCompanies.map((c) => `$${Math.round(c.revenue / (c.team || 1))}`)],
      ["Category", ...activeCompanies.map((c) => c.category)],
      ["Founder", ...activeCompanies.map((c) => c.founder)],
      ["ACV", ...activeCompanies.map((c) => c.acv)],
      ["Net Monthly Churn", ...activeCompanies.map((c) => c.churnRate)],
      ["Location", ...activeCompanies.map((c) => c.location)],
      ["Pricing Architecture", ...activeCompanies.map((c) => c.pricingModel)],
    ];
    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `revatlas-compare-${activeCompanies.map((c) => c.slug).join("-vs-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported competitor benchmark matrix to CSV!", "success");
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="container compare-page">
        <header className="hero-section">
          <div className="hero-badge">
            <span className="dot-pulse"></span> Multi-Company Financial Benchmarking
          </div>
          <h1 className="hero-title">Side-by-Side SaaS Comparison Matrix</h1>
          <p className="hero-sub">
            Benchmark revenue run-rates, valuation multiples, team capital efficiency, and customer churn between any companies in the 72,000+ SaaS directory.
          </p>

          {/* Quick Presets */}
          <div className="compare-presets">
            <span className="preset-label">Quick Benchmarks:</span>
            <button
              className="tag-chip"
              onClick={() => {
                const aiCompanies = companiesList.filter((d) => d.category?.includes("AI") || d.category?.includes("Workflow"));
                if (aiCompanies.length >= 2) {
                  setComp1Slug(aiCompanies[0].slug);
                  setComp2Slug(aiCompanies[1].slug);
                }
              }}
            >
              🤖 Top AI & Workflow SaaS
            </button>
            <button
              className="tag-chip"
              onClick={() => {
                const scaleups = companiesList.filter((d) => d.revenue >= 10000000);
                if (scaleups.length >= 2) {
                  setComp1Slug(scaleups[0].slug);
                  setComp2Slug(scaleups[1].slug);
                }
              }}
            >
              🏆 $10M+ ARR Scaleups
            </button>
            <button
              className="tag-chip"
              onClick={() => {
                const boot = companiesList.filter((d) => !d.funding);
                const funded = companiesList.filter((d) => d.funding > 5000000);
                if (boot.length && funded.length) {
                  setComp1Slug(boot[0].slug);
                  setComp2Slug(funded[0].slug);
                }
              }}
            >
              ⚡ Bootstrapped vs VC-Backed
            </button>
          </div>
        </header>

        {/* Company Selectors Bar */}
        <div className="compare-selectors-bar">
          {/* Slot 1 */}
          <div className="selector-box">
            <div className="selector-label-row">
              <label>Company 1</label>
              <button
                className="selector-search-trigger"
                onClick={() => setSearchTargetSlot(searchTargetSlot === 1 ? null : 1)}
              >
                🔍 Search 72K DB
              </button>
            </div>
            <select
              value={comp1Slug}
              onChange={(e) => setComp1Slug(e.target.value)}
              className="clean-select full"
            >
              {companiesList.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({fmtMoney(d.revenue)} ARR)
                </option>
              ))}
            </select>
          </div>

          <div className="vs-badge">VS</div>

          {/* Slot 2 */}
          <div className="selector-box">
            <div className="selector-label-row">
              <label>Company 2</label>
              <button
                className="selector-search-trigger"
                onClick={() => setSearchTargetSlot(searchTargetSlot === 2 ? null : 2)}
              >
                🔍 Search 72K DB
              </button>
            </div>
            <select
              value={comp2Slug}
              onChange={(e) => setComp2Slug(e.target.value)}
              className="clean-select full"
            >
              {companiesList.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({fmtMoney(d.revenue)} ARR)
                </option>
              ))}
            </select>
          </div>

          {showThird ? (
            <>
              <div className="vs-badge">VS</div>
              {/* Slot 3 */}
              <div className="selector-box">
                <div className="selector-label-row">
                  <label>Company 3</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="selector-search-trigger"
                      onClick={() => setSearchTargetSlot(searchTargetSlot === 3 ? null : 3)}
                    >
                      🔍 Search 72K DB
                    </button>
                    <button className="remove-link" onClick={() => setShowThird(false)}>
                      ✕
                    </button>
                  </div>
                </div>
                <select
                  value={comp3Slug}
                  onChange={(e) => setComp3Slug(e.target.value)}
                  className="clean-select full"
                >
                  {companiesList.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} ({fmtMoney(d.revenue)} ARR)
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <button className="btn-secondary add-third-btn" onClick={() => setShowThird(true)}>
              + Add 3rd Company
            </button>
          )}

          <button className="btn-primary" onClick={exportComparisonCSV}>
            ⬇ Export Matrix (CSV)
          </button>
        </div>

        {/* 72K Search Modal / Dropdown Bar when triggered */}
        {searchTargetSlot !== null && (
          <div className="compare-search-modal">
            <div className="compare-search-inner">
              <div className="compare-search-header">
                <span>Select Company for Slot {searchTargetSlot} from 72,000+ SaaS Directory</span>
                <button className="close-btn" onClick={() => setSearchTargetSlot(null)}>✕</button>
              </div>
              <div className="search-wrap" style={{ margin: "12px 0" }}>
                <span className="search-icon">{isSearching ? "⏳" : "🔍"}</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Type any SaaS company name (e.g. Canva, Stripe, Avify, HubSpot)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="search-results-list">
                {searchResults.map((c) => (
                  <div
                    key={c.slug}
                    className="search-result-item"
                    onClick={() => selectCompanyForSlot(c, searchTargetSlot)}
                  >
                    <div className="search-item-left">
                      <CompanyLogo website={c.website} name={c.name} size={28} />
                      <div>
                        <b>{c.name}</b>
                        <span className="search-item-sub"> · {c.category} · {c.location}</span>
                      </div>
                    </div>
                    <div className="search-item-right">
                      <span className="search-item-rev">{fmtMoney(c.revenue)} ARR</span>
                      <span className="btn-select">Select →</span>
                    </div>
                  </div>
                ))}
                {searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="search-empty">No companies found matching "{searchQuery}"</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Matrix Table */}
        <div className="table-card comparison-table-card">
          <table className="clean-table compare-table">
            <thead>
              <tr>
                <th style={{ width: "220px" }}>Metric Breakdown</th>
                {activeCompanies.map((c) => (
                  <th key={c.slug}>
                    <div className="compare-header-cell">
                      <CompanyLogo website={c.website} name={c.name} size={32} />
                      <span className="th-comp-name">{c.name}</span>
                      <span className="th-comp-cat">{c.category}</span>
                      <Link href={`/company/${c.slug}`} className="th-comp-link">
                        View Balance Sheet ↗
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Annual Revenue (ARR)</b></td>
                {activeCompanies.map((c) => {
                  const isMax = c.revenue === Math.max(...activeCompanies.map((x) => x.revenue));
                  return (
                    <td key={c.slug} className={isMax ? "metric-winner" : ""}>
                      <span className="rev-badge">{fmtMoney(c.revenue)}</span>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><b>Monthly Run-Rate (MRR)</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>{fmtMoney(c.mrr)}</td>
                ))}
              </tr>
              <tr>
                <td><b>YoY Growth Rate</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug} style={{ color: "var(--green)", fontWeight: 700 }}>
                    +{c.growthRate}%
                  </td>
                ))}
              </tr>
              <tr>
                <td><b>Estimated Valuation</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}><b>{fmtMoney(c.valuation)}</b></td>
                ))}
              </tr>
              <tr>
                <td><b>Valuation Multiple</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <span className="pill-neutral">{c.multiple}x ARR</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td><b>Total Capital Raised</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    {c.funding > 0 ? (
                      <span className="pill-neutral">{fmtMoney(c.funding)}</span>
                    ) : (
                      <span className="pill-green">Bootstrapped ($0)</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td><b>Team Size</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>{c.team} full-time members</td>
                ))}
              </tr>
              <tr>
                <td><b>ARR Per Employee</b></td>
                {activeCompanies.map((c) => {
                  const perEmp = Math.round(c.revenue / (c.team || 1));
                  return (
                    <td key={c.slug}>
                      <b>{fmtMoney(perEmp)}</b> / person
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td><b>Detected Tech Stack</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {(c.techStack || []).slice(0, 3).map((t) => (
                        <span key={t} className="pill-neutral" style={{ fontSize: "0.72rem" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td><b>Founder / Leadership</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <span className="founder-name">{c.founder}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td><b>Headquarters</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>{c.location}</td>
                ))}
              </tr>
              <tr>
                <td><b>Action</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <Link href={`/company/${c.slug}`} className="btn-secondary btn-sm btn-full">
                      Full Dossier ↗
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
