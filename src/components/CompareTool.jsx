"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import { showToast } from "./Toast";

function fmtMoney(v) {
  if (v == null) return "–";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${v}`;
}

export default function CompareTool({ data }) {
  const [comp1Slug, setComp1Slug] = useState(data[0]?.slug || "");
  const [comp2Slug, setComp2Slug] = useState(data[1]?.slug || "");
  const [comp3Slug, setComp3Slug] = useState(data[2]?.slug || "");
  const [showThird, setShowThird] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const c1 = p.get("comp1");
      const c2 = p.get("comp2");
      const c3 = p.get("comp3");
      if (c1 && data.some((d) => d.slug === c1)) setComp1Slug(c1);
      if (c2 && data.some((d) => d.slug === c2)) setComp2Slug(c2);
      if (c3 && data.some((d) => d.slug === c3)) {
        setComp3Slug(c3);
        setShowThird(true);
      }
    }
  }, [data]);

  const c1 = data.find((d) => d.slug === comp1Slug) || data[0];
  const c2 = data.find((d) => d.slug === comp2Slug) || data[1];
  const c3 = data.find((d) => d.slug === comp3Slug) || data[2];

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
      ["ARR Per Employee", ...activeCompanies.map((c) => `$${Math.round(c.revenue / c.team)}`)],
      ["Category", ...activeCompanies.map((c) => c.category)],
      ["Founder", ...activeCompanies.map((c) => c.founder)],
      ["ACV", ...activeCompanies.map((c) => c.acv)],
      ["Net Monthly Churn", ...activeCompanies.map((c) => c.churnRate)],
      ["Location", ...activeCompanies.map((c) => c.location)],
      ["Pricing Architecture", ...activeCompanies.map((c) => c.pricingModel)],
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saas-comparison-${c1.slug}-vs-${c2.slug}.csv`;
    a.click();
    showToast("Exported comparison matrix to CSV!", "success");
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="container compare-page">
        <header className="hero-section">
          <div className="hero-badge">
            <span className="dot-pulse"></span> B2B SaaS Benchmarking Engine
          </div>
          <h1 className="hero-title">Compare SaaS Metrics Side-by-Side</h1>
          <p className="hero-sub">
            Benchmark revenue run-rates, valuation multiples, team capital efficiency, and customer churn between market leaders.
          </p>

          {/* Quick Presets */}
          <div className="compare-presets">
            <span className="preset-label">Quick Benchmarks:</span>
            <button
              className="tag-chip"
              onClick={() => {
                const aiCompanies = data.filter((d) => d.category.includes("AI") || d.category.includes("Workflow"));
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
                const scaleups = data.filter((d) => d.revenue >= 10000000);
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
                const boot = data.filter((d) => !d.funding);
                const funded = data.filter((d) => d.funding > 5000000);
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
          <div className="selector-box">
            <label>Company 1</label>
            <select
              value={comp1Slug}
              onChange={(e) => setComp1Slug(e.target.value)}
              className="clean-select full"
            >
              {data.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} (${(d.revenue / 1e6).toFixed(1)}M ARR)
                </option>
              ))}
            </select>
          </div>

          <div className="vs-badge">VS</div>

          <div className="selector-box">
            <label>Company 2</label>
            <select
              value={comp2Slug}
              onChange={(e) => setComp2Slug(e.target.value)}
              className="clean-select full"
            >
              {data.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} (${(d.revenue / 1e6).toFixed(1)}M ARR)
                </option>
              ))}
            </select>
          </div>

          {showThird ? (
            <>
              <div className="vs-badge">VS</div>
              <div className="selector-box">
                <div className="selector-label-row">
                  <label>Company 3</label>
                  <button className="remove-link" onClick={() => setShowThird(false)}>
                    Remove ✕
                  </button>
                </div>
                <select
                  value={comp3Slug}
                  onChange={(e) => setComp3Slug(e.target.value)}
                  className="clean-select full"
                >
                  {data.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} (${(d.revenue / 1e6).toFixed(1)}M ARR)
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

        {/* Comparison Matrix Table */}
        <div className="table-card comparison-table-card">
          <table className="clean-table compare-table">
            <thead>
              <tr>
                <th style={{ width: "220px" }}>Metric Breakdown</th>
                {activeCompanies.map((c) => (
                  <th key={c.slug}>
                    <div className="compare-header-cell">
                      <span className="th-comp-name">{c.name}</span>
                      <span className="th-comp-cat">{c.category}</span>
                      <Link href={`/company/${c.slug}`} className="th-comp-link">
                        View Full Profile ↗
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
                      {isMax && <span className="winner-pill">Leader</span>}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td><b>Monthly Revenue (MRR)</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}><b>{fmtMoney(c.mrr)}</b></td>
                ))}
              </tr>

              <tr>
                <td><b>Estimated Valuation</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>{fmtMoney(c.valuation)}</td>
                ))}
              </tr>

              <tr>
                <td><b>Valuation Multiple</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}><span className="pill-neutral">{c.multiple}x ARR</span></td>
                ))}
              </tr>

              <tr>
                <td><b>YoY Growth Velocity</b></td>
                {activeCompanies.map((c) => {
                  const isMax = c.growthRate === Math.max(...activeCompanies.map((x) => x.growthRate));
                  return (
                    <td key={c.slug} className={isMax ? "metric-winner" : ""}>
                      <span style={{ color: "var(--green)", fontWeight: 700 }}>+{c.growthRate}%</span>
                      {isMax && <span className="winner-pill">Fastest</span>}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td><b>Capital Raised</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    {c.funding ? fmtMoney(c.funding) : <span className="boot-tag">Bootstrapped</span>}
                  </td>
                ))}
              </tr>

              <tr>
                <td><b>Headcount & Efficiency</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <div><b>{c.team} people</b></div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {fmtMoney(Math.round(c.revenue / c.team))} / person
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td><b>Average Contract Value (ACV)</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>{c.acv}</td>
                ))}
              </tr>

              <tr>
                <td><b>Monthly Churn Rate</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>{c.churnRate}</td>
                ))}
              </tr>

              <tr>
                <td><b>Founder / CEO</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <b>{c.founder}</b>
                    <div style={{ fontSize: "11px", color: "var(--green)" }}>✓ Verified Contact</div>
                  </td>
                ))}
              </tr>

              <tr>
                <td><b>Pricing Architecture</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}><span className="pill-neutral">{c.pricingModel}</span></td>
                ))}
              </tr>

              <tr>
                <td><b>Headquarters</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>📍 {c.location}</td>
                ))}
              </tr>

              <tr>
                <td><b>Detected Tech Stack</b></td>
                {activeCompanies.map((c) => (
                  <td key={c.slug}>
                    <div className="mini-tech-wrap">
                      {c.techStack.map((t) => (
                        <span key={t} className="tech-tag-sm">{t}</span>
                      ))}
                    </div>
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
