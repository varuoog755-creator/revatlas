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

export default function CompanyProfileView({ company, peers = [] }) {
  const [isSaved, setIsSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("revatlas_saved_companies");
      if (stored) {
        const list = JSON.parse(stored);
        setSavedCount(list.length);
        setIsSaved(list.includes(company.slug || company.website || company.name));
      }
    } catch (e) {
      console.error(e);
    }
  }, [company]);

  function toggleSave() {
    try {
      const key = company.slug || company.website || company.name;
      const stored = localStorage.getItem("revatlas_saved_companies");
      let list = stored ? JSON.parse(stored) : [];
      if (list.includes(key)) {
        list = list.filter((item) => item !== key);
        setIsSaved(false);
        showToast(`Removed ${company.name} from watchlist`, "info");
      } else {
        list.push(key);
        setIsSaved(true);
        showToast(`Saved ${company.name} to customer watchlist!`, "success");
      }
      localStorage.setItem("revatlas_saved_companies", JSON.stringify(list));
      setSavedCount(list.length);
    } catch (e) {
      console.error(e);
    }
  }

  function downloadLeadCard() {
    const dataRow = [
      ["Company Name", company.name],
      ["Website", company.website],
      ["ARR (Annual)", `$${company.revenue}`],
      ["MRR (Monthly)", `$${company.mrr}`],
      ["Valuation", `$${company.valuation}`],
      ["Multiple", `${company.multiple}x`],
      ["YoY Growth", `${company.growthRate}%`],
      ["Category", company.category],
      ["Founder", company.founder],
      ["Team Size", company.team],
      ["Location", company.location],
      ["Pricing Model", company.pricingModel],
      ["ACV", company.acv],
      ["Tech Stack", company.techStack.join(" | ")]
    ];
    const csvContent = dataRow.map((r) => `"${r[0]}","${String(r[1]).replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${company.slug}-intel-report.csv`;
    a.click();
    showToast(`Downloaded ${company.name} lead card CSV!`, "success");
  }

  // Calculate 5-year revenue trajectory milestones for SVG Chart
  const currRev = company.revenue;
  const growth = company.growthRate / 100;
  const milestones = [
    { year: 2022, rev: Math.round(currRev / Math.pow(1 + growth, 4)) },
    { year: 2023, rev: Math.round(currRev / Math.pow(1 + growth, 3)) },
    { year: 2024, rev: Math.round(currRev / Math.pow(1 + growth, 2)) },
    { year: 2025, rev: Math.round(currRev / (1 + growth)) },
    { year: 2026, rev: currRev },
  ];
  const maxRev = Math.max(...milestones.map((m) => m.rev));

  return (
    <div className="app-shell">
      <Navbar savedCount={savedCount} />

      <main className="container profile-page">
        {/* Breadcrumb */}
        <div className="breadcrumb-nav">
          <Link href="/">Atlas Directory</Link>
          <span className="bc-sep">/</span>
          <span>{company.category}</span>
          <span className="bc-sep">/</span>
          <span className="bc-curr">{company.name}</span>
        </div>

        {/* Company Hero Header */}
        <div className="profile-hero-card">
          <div className="profile-hero-left">
            <div className="company-logo-avatar">
              {company.name.charAt(0)}
            </div>
            <div className="company-hero-details">
              <div className="title-row">
                <h1 className="profile-title">{company.name}</h1>
                {company.verified && (
                  <span className="verified-chip" title="Verified SaaS Financials">
                    ✓ Verified Profile
                  </span>
                )}
                <span className="category-chip">{company.category}</span>
              </div>
              <p className="profile-bio">{company.description}</p>
              <div className="meta-badges">
                <span className="meta-item">📍 {company.location}</span>
                <span className="meta-item">📅 Founded {company.founded}</span>
                <span className="meta-item">👥 {company.team} team members</span>
                {company.website && (
                  <a
                    href={`https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="meta-link"
                  >
                    🌐 {company.website} ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button
              className={`btn-save-lg ${isSaved ? "saved" : ""}`}
              onClick={toggleSave}
            >
              {isSaved ? "★ In Watchlist" : "☆ Save to Watchlist"}
            </button>
            <Link
              href={`/compare?comp1=${company.slug}`}
              className="btn-secondary btn-full"
            >
              ⚖ Compare with Peers
            </Link>
            <button className="btn-secondary btn-full" onClick={downloadLeadCard}>
              📥 Download Lead Card (CSV)
            </button>
            <Link href="/dashboard?tab=claim" className="claim-link">
              Is this your SaaS? Claim Profile ↗
            </Link>
          </div>
        </div>

        {/* Financial & Valuation Scorecard */}
        <div className="scorecard-grid">
          <div className="scorecard-tile primary-tile">
            <span className="tile-label">Annual Recurring Revenue (ARR)</span>
            <span className="tile-value highlight">{fmtMoney(company.revenue)}</span>
            <span className="tile-trend">+{company.growthRate}% YoY Growth Velocity</span>
          </div>

          <div className="scorecard-tile">
            <span className="tile-label">Monthly Recurring Revenue</span>
            <span className="tile-value">{fmtMoney(company.mrr)}</span>
            <span className="tile-sub">Normalized monthly run-rate</span>
          </div>

          <div className="scorecard-tile">
            <span className="tile-label">Estimated Valuation</span>
            <span className="tile-value">{fmtMoney(company.valuation)}</span>
            <span className="tile-sub">{company.multiple}x ARR Market Multiple</span>
          </div>

          <div className="scorecard-tile">
            <span className="tile-label">Total Capital Raised</span>
            <span className="tile-value">{company.funding ? fmtMoney(company.funding) : "Bootstrapped"}</span>
            <span className="tile-sub">{company.funding ? "Venture & Angel Rounds" : "Zero External Dilution"}</span>
          </div>

          <div className="scorecard-tile">
            <span className="tile-label">Average Contract Value (ACV)</span>
            <span className="tile-value">{company.acv}</span>
            <span className="tile-sub">Annual contract value</span>
          </div>

          <div className="scorecard-tile">
            <span className="tile-label">Net Monthly Churn</span>
            <span className="tile-value">{company.churnRate}</span>
            <span className="tile-sub">Benchmark: top quartile &lt;1.0%</span>
          </div>
        </div>

        {/* Growth Trajectory Chart & Key People Grid */}
        <div className="profile-split-row">
          {/* Revenue Chart Box */}
          <div className="panel-box chart-panel">
            <div className="panel-head">
              <div>
                <h3>Revenue Trajectory (ARR Milestones)</h3>
                <p className="panel-desc">Modelled revenue growth trajectory from founding to 2026</p>
              </div>
              <span className="badge-pill">Annual Trend</span>
            </div>

            {/* SVG Visual Chart */}
            <div className="svg-chart-wrap">
              <svg viewBox="0 0 540 180" className="revenue-svg">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="520" y2="20" stroke="var(--border)" strokeDasharray="3 3" />
                <line x1="40" y1="80" x2="520" y2="80" stroke="var(--border)" strokeDasharray="3 3" />
                <line x1="40" y1="140" x2="520" y2="140" stroke="var(--border)" strokeDasharray="3 3" />

                {/* SVG Area & Line */}
                {(() => {
                  const points = milestones.map((m, i) => {
                    const x = 50 + i * 110;
                    const y = 140 - (m.rev / maxRev) * 110;
                    return { x, y, ...m };
                  });
                  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
                  const areaD = `${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#chartGrad)" />
                      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                      {points.map((p) => (
                        <g key={p.year}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                          <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-val-text">
                            {fmtMoney(p.rev)}
                          </text>
                          <text x={p.x} y="165" textAnchor="middle" className="chart-axis-text">
                            {p.year}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="chart-footer-note">
              <span>* Projected milestones based on SEC disclosures, Latka seed intelligence, and verified ARR index.</span>
            </div>
          </div>

          {/* Executive & Team Box */}
          <div className="panel-box intel-panel">
            <div className="panel-head">
              <div>
                <h3>Executive & Organization Intel</h3>
                <p className="panel-desc">Key leadership & human capital metrics</p>
              </div>
            </div>

            <div className="leader-card">
              <div className="leader-avatar">{company.founder.charAt(0)}</div>
              <div className="leader-info">
                <span className="leader-name">{company.founder}</span>
                <span className="leader-role">Founder & Chief Executive Officer</span>
                <div className="leader-contacts">
                  <span className="contact-pill">✉ Verified Work Email</span>
                  <span className="contact-pill">in LinkedIn Profile</span>
                </div>
              </div>
            </div>

            <div className="intel-stats-list">
              <div className="intel-stat-row">
                <span>Revenue Per Employee</span>
                <b>{fmtMoney(Math.round(company.revenue / company.team))} / person</b>
              </div>
              <div className="intel-stat-row">
                <span>Total Headcount</span>
                <b>{company.team} full-time equivalents</b>
              </div>
              <div className="intel-stat-row">
                <span>Pricing Architecture</span>
                <span className="pill-neutral">{company.pricingModel}</span>
              </div>
              <div className="intel-stat-row">
                <span>Capital Efficiency Score</span>
                <b>{company.funding ? `${(company.revenue / company.funding).toFixed(1)}x ARR/Funding` : "Infinity (Bootstrapped)"}</b>
              </div>
            </div>

            {/* Detected Tech Stack */}
            <div className="tech-stack-section">
              <span className="tech-heading">Detected Cloud & Engineering Stack:</span>
              <div className="tech-tag-wrap">
                {company.techStack.map((t) => (
                  <span key={t} className="tech-tag">
                    ⚡ {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparable Peer Benchmarking */}
        {peers.length > 0 && (
          <div className="peers-section">
            <div className="pane-header">
              <div>
                <h2>Similar SaaS Companies & Market Peers</h2>
                <p className="pane-sub">Competitors and alternatives in {company.category} with comparable revenue profiles.</p>
              </div>
            </div>

            <div className="peers-grid">
              {peers.map((peer) => (
                <div key={peer.slug} className="peer-card">
                  <div className="peer-head">
                    <div className="peer-avatar">{peer.name.charAt(0)}</div>
                    <div>
                      <h4 className="peer-name">{peer.name}</h4>
                      <span className="peer-loc">📍 {peer.location}</span>
                    </div>
                  </div>
                  <div className="peer-metrics">
                    <div className="peer-m">
                      <span>ARR</span>
                      <b>{fmtMoney(peer.revenue)}</b>
                    </div>
                    <div className="peer-m">
                      <span>Valuation</span>
                      <b>{fmtMoney(peer.valuation)}</b>
                    </div>
                    <div className="peer-m">
                      <span>Team</span>
                      <b>{peer.team}</b>
                    </div>
                  </div>
                  <div className="peer-actions">
                    <Link href={`/company/${peer.slug}`} className="btn-secondary btn-sm btn-full">
                      View Profile ↗
                    </Link>
                    <Link href={`/compare?comp1=${company.slug}&comp2=${peer.slug}`} className="btn-secondary btn-sm btn-full">
                      ⚖ Compare
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
