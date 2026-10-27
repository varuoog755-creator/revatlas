"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import CompanyLogo from "./CompanyLogo";
import { showToast } from "./Toast";
import { useAuth } from "../lib/auth";

function fmtMoney(v) {
  if (v == null) return "–";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  return `$${v}`;
}

export default function CustomerDashboard({ initialData = [] }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved");
  const [savedIds, setSavedIds] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Export History State
  const [exportHistory, setExportHistory] = useState([
    {
      id: 1,
      date: "27 Oct 2026, 09:15",
      name: "Top-ARR-Enterprise-SaaS.csv",
      rows: 50,
      filter: "ARR > $10M, Global",
      size: "24.5 KB",
    },
    {
      id: 2,
      date: "25 Oct 2026, 14:35",
      name: "US-SaaS-$1M-plus.csv",
      rows: 45,
      filter: "Rev > $1M, US Only",
      size: "18.2 KB",
    },
    {
      id: 3,
      date: "24 Oct 2026, 19:10",
      name: "Funded-Seed-SaaS.csv",
      rows: 88,
      filter: "Funded only, Founded 2020+",
      size: "36.8 KB",
    },
  ]);

  // Claim Form State
  const [claimForm, setClaimForm] = useState({
    name: "",
    website: "",
    arr: "",
    team: "",
    funding: "",
    founderEmail: "",
    note: "",
  });
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [submittedClaims, setSubmittedClaims] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("revatlas_submitted_claims");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      {
        ticket: "REV-AUDIT-9281",
        name: "Acme Cloud Platform",
        website: "acmecloud.io",
        arr: "$3.8M",
        date: "26 Oct 2026",
        status: "In Review (Stage 2/3: Revenue Verification)",
      },
    ];
  });

  // Live API Playground State
  const [apiEndpoint, setApiEndpoint] = useState("/api/companies?limit=3");
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiLatency, setApiLatency] = useState(null);

  // Webhooks State
  const [webhookUrl, setWebhookUrl] = useState("https://api.yourcrm.com/webhooks/revatlas");
  const [webhookStatus, setWebhookStatus] = useState("");
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState({
    milestone: true,
    funding: true,
    executive: false,
    multiple: true,
  });

  // Load saved companies from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("revatlas_saved_companies");
      if (stored) {
        setSavedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["saved", "exports", "api", "webhooks", "claim", "billing"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const savedCompanies = initialData.filter((item) =>
    savedIds.includes(item.slug || item.website || item.name)
  );

  const filteredSaved = savedCompanies.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.founder && c.founder.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  function removeSaved(id) {
    const next = savedIds.filter((item) => item !== id);
    setSavedIds(next);
    localStorage.setItem("revatlas_saved_companies", JSON.stringify(next));
    showToast("Removed from watchlist", "info");
  }

  function addQuickSample(company) {
    const key = company.slug || company.website || company.name;
    if (!savedIds.includes(key)) {
      const next = [...savedIds, key];
      setSavedIds(next);
      localStorage.setItem("revatlas_saved_companies", JSON.stringify(next));
      showToast(`Added ${company.name} to your watchlist!`, "success");
    }
  }

  function exportSavedCSV() {
    if (savedCompanies.length === 0) return;
    const header = [
      "Company Name",
      "Website",
      "ARR (Annual)",
      "MRR (Monthly)",
      "Valuation",
      "Multiple",
      "Growth Rate",
      "Category",
      "Funding",
      "Founder",
      "Team Size",
      "Location",
      "Tech Stack",
    ];
    const lines = [header.join(",")];
    for (const r of savedCompanies) {
      lines.push(
        [
          r.name,
          r.website,
          r.revenue ?? "",
          r.mrr ?? "",
          r.valuation ?? "",
          `${r.multiple || 7.5}x`,
          `${r.growthRate}%`,
          r.category,
          r.funding ?? "",
          r.founder ?? "",
          r.team ?? "",
          r.location ?? "",
          (r.techStack || []).join(" | "),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `revatlas-watchlist-leads-${savedCompanies.length}.csv`;
    a.click();

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      name: `revatlas-watchlist-leads-${savedCompanies.length}.csv`,
      rows: savedCompanies.length,
      filter: "Custom Saved Watchlist",
      size: `${(blob.size / 1024).toFixed(1)} KB`,
    };
    setExportHistory((prev) => [newEntry, ...prev]);
    showToast(`Exported ${savedCompanies.length} company leads to CSV!`, "success");
  }

  function copyApiKey() {
    navigator.clipboard?.writeText("rev_live_948f2b79a103c847e928b");
    setApiKeyCopied(true);
    showToast("Live API Secret Key copied to clipboard!", "success");
    setTimeout(() => setApiKeyCopied(false), 2500);
  }

  async function runApiPlayground() {
    setApiLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(apiEndpoint);
      const data = await res.json();
      const end = performance.now();
      setApiLatency(Math.round(end - start));
      setApiResponse(data);
      showToast(`HTTP ${res.status} OK — Received in ${Math.round(end - start)}ms`, "success");
    } catch (err) {
      const end = performance.now();
      setApiLatency(Math.round(end - start));
      setApiResponse({
        error: "Failed to fetch from endpoint",
        message: err.message,
      });
      showToast("API request error", "error");
    } finally {
      setApiLoading(false);
    }
  }

  function handleClaimSubmit(e) {
    e.preventDefault();
    if (!claimForm.name || !claimForm.website) return;
    setClaimSubmitting(true);
    setTimeout(() => {
      setClaimSubmitting(false);
      const newClaim = {
        ticket: `REV-AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: claimForm.name,
        website: claimForm.website,
        arr: claimForm.arr || "$1.5M",
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: "Pending Review (Stage 1/3: Domain Ownership)",
      };
      const updated = [newClaim, ...submittedClaims];
      setSubmittedClaims(updated);
      try {
        localStorage.setItem("revatlas_submitted_claims", JSON.stringify(updated));
      } catch (err) {}
      setClaimForm({ name: "", website: "", arr: "", team: "", funding: "", founderEmail: "", note: "" });
      showToast(`Verification ticket ${newClaim.ticket} created! Audit team will review within 24h.`, "success");
    }, 800);
  }

  function testWebhook() {
    setWebhookTesting(true);
    setWebhookStatus("");
    setTimeout(() => {
      setWebhookTesting(false);
      setWebhookStatus("✓ 200 OK — Test webhook payload successfully delivered to endpoint!");
      showToast("Webhook test ping delivered successfully!", "success");
    }, 700);
  }

  const sampleCompanies = initialData.slice(0, 4);

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Gourav";

  return (
    <div className="app-shell">
      <Navbar savedCount={savedIds.length} />

      <main className="dash-v2-main">
        <div className="dash-v2-container">
          {/* Top Banner Ribbon */}
          <div className="dash-v2-hero">
            <div className="dash-v2-hero-info">
              <div className="dash-v2-pill-row">
                <span className="dash-live-badge">
                  <span className="live-dot" /> LIVE WORKSPACE
                </span>
                <span className="dash-role-badge">
                  {user?.user_metadata?.role || "Founder / Pro Tier"}
                </span>
                <span className="dash-credit-badge">⚡ 88 / 100 Credits Left</span>
              </div>
              <h1 className="dash-v2-title">
                Welcome back, {userName}
              </h1>
              <p className="dash-v2-subtitle">
                Manage your saved SaaS targets, export verified outbound lists, run programmatic REST API queries, and track real-time revenue events.
              </p>
            </div>

            <div className="dash-v2-hero-card">
              <div className="hero-quota-header">
                <span className="quota-title">Monthly Lead Quota</span>
                <span className="quota-plan">Pro Tier ($29/mo)</span>
              </div>

              <div className="hero-quota-bar-wrap">
                <div className="quota-bar-labels">
                  <span>Export Credits Used</span>
                  <strong>12 / 100 (88 remaining)</strong>
                </div>
                <div className="quota-progress-track">
                  <div className="quota-progress-fill" style={{ width: "12%" }} />
                </div>
              </div>

              <div className="hero-quota-footer">
                <span className="quota-refresh">Resets on Nov 1, 2026</span>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => setActiveTab("billing")}
                >
                  Manage Plan & Invoices ↗
                </button>
              </div>
            </div>
          </div>

          {/* KPI Metrics Cards */}
          <section className="dash-kpi-row">
            <div
              className={`dash-kpi-card ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
              role="button"
              tabIndex={0}
            >
              <div className="kpi-top">
                <span className="kpi-icon-wrap">📌</span>
                <span className="kpi-chip positive">+4 new</span>
              </div>
              <div className="kpi-big-num">{savedCompanies.length}</div>
              <div className="kpi-title">Saved Watchlist Leads</div>
              <div className="kpi-meta">High-intent targets for outreach</div>
            </div>

            <div
              className={`dash-kpi-card ${activeTab === "exports" ? "active" : ""}`}
              onClick={() => setActiveTab("exports")}
              role="button"
              tabIndex={0}
            >
              <div className="kpi-top">
                <span className="kpi-icon-wrap">📥</span>
                <span className="kpi-chip neutral">CSV UTF-8</span>
              </div>
              <div className="kpi-big-num">{exportHistory.length} Batches</div>
              <div className="kpi-title">Export Activity</div>
              <div className="kpi-meta">183 total leads downloaded</div>
            </div>

            <div
              className={`dash-kpi-card ${activeTab === "api" ? "active" : ""}`}
              onClick={() => setActiveTab("api")}
              role="button"
              tabIndex={0}
            >
              <div className="kpi-top">
                <span className="kpi-icon-wrap">⚡</span>
                <span className="kpi-chip positive">99.98% SLA</span>
              </div>
              <div className="kpi-big-num">42 / 10K</div>
              <div className="kpi-title">Daily REST API Calls</div>
              <div className="kpi-meta">Fast low-latency JSON endpoints</div>
            </div>

            <div
              className={`dash-kpi-card ${activeTab === "webhooks" ? "active" : ""}`}
              onClick={() => setActiveTab("webhooks")}
              role="button"
              tabIndex={0}
            >
              <div className="kpi-top">
                <span className="kpi-icon-wrap">🔔</span>
                <span className="kpi-chip positive">Active</span>
              </div>
              <div className="kpi-big-num">3 Events</div>
              <div className="kpi-title">Real-Time Webhooks</div>
              <div className="kpi-meta">Automated revenue alert pings</div>
            </div>
          </section>

          {/* Navigation Tab Bar */}
          <div className="dash-nav-tabs">
            <button
              type="button"
              className={`dash-nav-btn ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              <span className="dash-tab-icon">📌</span>
              <span>Watchlist</span>
              <span className="dash-tab-count">{savedCompanies.length}</span>
            </button>

            <button
              type="button"
              className={`dash-nav-btn ${activeTab === "exports" ? "active" : ""}`}
              onClick={() => setActiveTab("exports")}
            >
              <span className="dash-tab-icon">📥</span>
              <span>Export History</span>
              <span className="dash-tab-count">{exportHistory.length}</span>
            </button>

            <button
              type="button"
              className={`dash-nav-btn ${activeTab === "api" ? "active" : ""}`}
              onClick={() => setActiveTab("api")}
            >
              <span className="dash-tab-icon">🔑</span>
              <span>API Playground & Keys</span>
            </button>

            <button
              type="button"
              className={`dash-nav-btn ${activeTab === "webhooks" ? "active" : ""}`}
              onClick={() => setActiveTab("webhooks")}
            >
              <span className="dash-tab-icon">🔔</span>
              <span>Webhooks & Alerts</span>
            </button>

            <button
              type="button"
              className={`dash-nav-btn ${activeTab === "claim" ? "active" : ""}`}
              onClick={() => setActiveTab("claim")}
            >
              <span className="dash-tab-icon">🏢</span>
              <span>Claim SaaS Profile</span>
            </button>

            <button
              type="button"
              className={`dash-nav-btn ${activeTab === "billing" ? "active" : ""}`}
              onClick={() => setActiveTab("billing")}
            >
              <span className="dash-tab-icon">💳</span>
              <span>Billing & Plan</span>
            </button>
          </div>

          {/* TAB 1: SAVED WATCHLIST */}
          {activeTab === "saved" && (
            <div className="dash-tab-content">
              <div className="dash-section-header">
                <div>
                  <h2 className="dash-section-title">Saved SaaS Target Watchlist</h2>
                  <p className="dash-section-sub">
                    Bookmarked companies from the RevAtlas 72,000+ directory. Filter, compare metrics, and export clean CSV dossiers.
                  </p>
                </div>

                {savedCompanies.length > 0 && (
                  <div className="dash-header-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={exportSavedCSV}
                    >
                      ⬇ Export Watchlist CSV ({savedCompanies.length})
                    </button>
                    {savedCompanies.length >= 2 && (
                      <Link
                        href={`/compare?comp1=${savedCompanies[0].slug}&comp2=${savedCompanies[1].slug}`}
                        className="btn-secondary"
                      >
                        ⚖ Compare Top 2
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {savedCompanies.length === 0 ? (
                <div className="dash-empty-state">
                  <div className="empty-state-icon">📂</div>
                  <h3 className="empty-state-title">Your Watchlist is Currently Empty</h3>
                  <p className="empty-state-desc">
                    Bookmark companies across the RevAtlas directory to monitor their ARR trajectories, EV/ARR multiples, and verified executive contacts.
                  </p>

                  <div className="empty-recommend-block">
                    <div className="empty-recommend-label">
                      ⚡ Quick Add Recommended SaaS to Watchlist:
                    </div>
                    <div className="empty-quick-add-grid">
                      {sampleCompanies.map((c) => (
                        <div key={c.slug} className="quick-add-card">
                          <div className="quick-add-info">
                            <CompanyLogo website={c.website} name={c.name} size={32} />
                            <div>
                              <strong className="quick-add-name">{c.name}</strong>
                              <span className="quick-add-rev">{fmtMoney(c.revenue)} ARR</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-quick-add"
                            onClick={() => addQuickSample(c)}
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link href="/" className="btn-primary empty-browse-btn">
                    🌍 Explore 72,000+ Verified SaaS Directory →
                  </Link>
                </div>
              ) : (
                <div className="dash-table-wrap">
                  <div className="dash-table-toolbar">
                    <input
                      type="text"
                      className="dash-filter-input"
                      placeholder="Search saved companies by name, sector, or founder..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                    <span className="dash-table-counter">
                      Showing <b>{filteredSaved.length}</b> of <b>{savedCompanies.length}</b> saved leads
                    </span>
                  </div>

                  <table className="dash-clean-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Sector</th>
                        <th>ARR (Annual)</th>
                        <th>Valuation</th>
                        <th>Multiple</th>
                        <th>Growth YoY</th>
                        <th>Founder</th>
                        <th>Location</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSaved.map((c) => (
                        <tr key={c.slug || c.website || c.name}>
                          <td>
                            <div className="table-company-cell">
                              <CompanyLogo website={c.website} name={c.name} size={36} />
                              <div className="table-company-meta">
                                <Link href={`/company/${c.slug}`} className="table-company-name">
                                  {c.name} <span className="arrow-chip">↗</span>
                                </Link>
                                <span className="table-company-domain">{c.website}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge-sector">{c.category}</span>
                          </td>
                          <td>
                            <span className="badge-revenue">{fmtMoney(c.revenue)}</span>
                          </td>
                          <td className="table-val-cell">{fmtMoney(c.valuation)}</td>
                          <td>
                            <span className="badge-multiple">{c.multiple || 7.5}x</span>
                          </td>
                          <td className="table-growth-cell">+{c.growthRate}%</td>
                          <td className="table-founder-cell">{c.founder || "Executive Team"}</td>
                          <td className="table-loc-cell">{c.location || "United States"}</td>
                          <td style={{ textAlign: "right" }}>
                            <div className="table-actions-cell">
                              <Link
                                href={`/compare?comp1=${c.slug}`}
                                className="action-pill compare"
                                title="Compare with peers"
                              >
                                ⚖ Compare
                              </Link>
                              <button
                                type="button"
                                className="action-pill remove"
                                onClick={() => removeSaved(c.slug || c.website || c.name)}
                                title="Remove from watchlist"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT HISTORY */}
          {activeTab === "exports" && (
            <div className="dash-tab-content">
              <div className="dash-section-header">
                <div>
                  <h2 className="dash-section-title">CSV Lead Export History</h2>
                  <p className="dash-section-sub">
                    View and re-download previously exported company lists. All exports include full contact and financial attributes.
                  </p>
                </div>
              </div>

              <div className="dash-table-wrap">
                <table className="dash-clean-table">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Date Exported</th>
                      <th>Records</th>
                      <th>Filter Criteria</th>
                      <th>File Size</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="file-name-cell">
                            <span className="file-icon">📄</span>
                            <strong>{item.name}</strong>
                          </div>
                        </td>
                        <td className="table-loc-cell">{item.date}</td>
                        <td>
                          <span className="badge-sector">{item.rows} leads</span>
                        </td>
                        <td className="table-filter-cell">{item.filter}</td>
                        <td className="table-loc-cell">{item.size || "22 KB"}</td>
                        <td>
                          <span className="badge-status-ok">✓ Ready</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => showToast(`Re-downloading ${item.name}...`, "success")}
                          >
                            ⬇ Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: API PLAYGROUND & KEYS */}
          {activeTab === "api" && (
            <div className="dash-tab-content">
              <div className="dash-section-header">
                <div>
                  <h2 className="dash-section-title">Programmatic REST API & Live Playground</h2>
                  <p className="dash-section-sub">
                    Direct access to the 72,000+ verified SaaS database with low latency JSON endpoints.
                  </p>
                </div>
              </div>

              {/* API Key Box */}
              <div className="api-key-card">
                <div className="api-key-header">
                  <div>
                    <strong className="api-key-label">Production API Secret Key</strong>
                    <p className="api-key-desc">Use this Bearer token in your HTTP Authorization header.</p>
                  </div>
                  <div className="api-key-actions">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setApiKeyRevealed((v) => !v)}
                    >
                      {apiKeyRevealed ? "Hide Key" : "Reveal Key"}
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={copyApiKey}
                    >
                      {apiKeyCopied ? "✓ Copied!" : "Copy Key"}
                    </button>
                  </div>
                </div>
                <div className="api-key-display">
                  <code>
                    {apiKeyRevealed
                      ? "rev_live_948f2b79a103c847e928b"
                      : "rev_live_•••••••••••••••••••••"}
                  </code>
                  <span className="badge-scope">Permissions: read:companies, export:csv</span>
                </div>
              </div>

              {/* Interactive Playground Box */}
              <div className="playground-card">
                <div className="playground-header">
                  <span className="playground-title">Live API Test Runner</span>
                  <div className="preset-buttons">
                    <span className="preset-label">Presets:</span>
                    <button
                      type="button"
                      className="preset-pill"
                      onClick={() => setApiEndpoint("/api/companies?limit=3")}
                    >
                      Top ARR (3)
                    </button>
                    <button
                      type="button"
                      className="preset-pill"
                      onClick={() => setApiEndpoint("/api/companies?category=AI+%26+Automation&limit=3")}
                    >
                      AI Sector
                    </button>
                    <button
                      type="button"
                      className="preset-pill"
                      onClick={() => setApiEndpoint("/api/companies?minArr=100000000&limit=3")}
                    >
                      ARR &gt; $100M
                    </button>
                  </div>
                </div>

                <div className="endpoint-input-row">
                  <span className="http-method-pill">GET</span>
                  <input
                    type="text"
                    className="endpoint-input"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="/api/companies?limit=5"
                  />
                  <button
                    type="button"
                    className="btn-primary btn-send-api"
                    onClick={runApiPlayground}
                    disabled={apiLoading}
                  >
                    {apiLoading ? "Running..." : "▶ Send Request"}
                  </button>
                </div>

                {/* API Response Display */}
                {apiResponse && (
                  <div className="api-response-block">
                    <div className="response-header">
                      <div className="response-status">
                        <span className="status-dot-ok" />
                        <strong>Status: 200 OK</strong>
                        {apiLatency && <span className="latency-pill">{apiLatency} ms</span>}
                      </div>
                      <button
                        type="button"
                        className="btn-copy-json"
                        onClick={() => {
                          navigator.clipboard?.writeText(JSON.stringify(apiResponse, null, 2));
                          showToast("Copied JSON response!", "success");
                        }}
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="response-json">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WEBHOOKS & ALERTS */}
          {activeTab === "webhooks" && (
            <div className="dash-tab-content">
              <div className="dash-section-header">
                <div>
                  <h2 className="dash-section-title">Automated Revenue & Valuation Webhooks</h2>
                  <p className="dash-section-sub">
                    Receive real-time HTTP POST notifications when tracked companies hit ARR milestones or close funding rounds.
                  </p>
                </div>
              </div>

              <div className="webhook-card">
                <div className="form-group">
                  <label className="form-label">Destination Webhook URL (HTTPS)</label>
                  <div className="webhook-input-row">
                    <input
                      type="url"
                      className="form-input"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.yourcrm.com/webhooks/revatlas"
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => showToast("Webhook destination URL saved!", "success")}
                    >
                      Save URL
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={testWebhook}
                      disabled={webhookTesting}
                    >
                      {webhookTesting ? "Pinging..." : "Test Ping"}
                    </button>
                  </div>
                </div>

                {webhookStatus && (
                  <div className="webhook-status-alert">
                    <span>{webhookStatus}</span>
                  </div>
                )}

                <div className="webhook-events-section">
                  <h3 className="events-title">Subscribed Event Triggers</h3>
                  <div className="events-grid">
                    <label className="event-checkbox-card">
                      <input
                        type="checkbox"
                        checked={webhookEvents.milestone}
                        onChange={(e) =>
                          setWebhookEvents((prev) => ({ ...prev, milestone: e.target.checked }))
                        }
                      />
                      <div>
                        <strong>company.arr_milestone_crossed</strong>
                        <p>Fires when a company crosses $1M, $10M, or $50M ARR.</p>
                      </div>
                    </label>

                    <label className="event-checkbox-card">
                      <input
                        type="checkbox"
                        checked={webhookEvents.funding}
                        onChange={(e) =>
                          setWebhookEvents((prev) => ({ ...prev, funding: e.target.checked }))
                        }
                      />
                      <div>
                        <strong>company.funding_announced</strong>
                        <p>Fires when a new Seed, Series A/B, or PE round is detected.</p>
                      </div>
                    </label>

                    <label className="event-checkbox-card">
                      <input
                        type="checkbox"
                        checked={webhookEvents.multiple}
                        onChange={(e) =>
                          setWebhookEvents((prev) => ({ ...prev, multiple: e.target.checked }))
                        }
                      />
                      <div>
                        <strong>company.valuation_updated</strong>
                        <p>Fires when sector median multiple changes benchmark value.</p>
                      </div>
                    </label>

                    <label className="event-checkbox-card">
                      <input
                        type="checkbox"
                        checked={webhookEvents.executive}
                        onChange={(e) =>
                          setWebhookEvents((prev) => ({ ...prev, executive: e.target.checked }))
                        }
                      />
                      <div>
                        <strong>company.executive_transition</strong>
                        <p>Fires when C-suite or founder changes are verified.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLAIM / SUBMIT SAAS PROFILE */}
          {activeTab === "claim" && (
            <div className="dash-tab-content">
              <div className="dash-section-header">
                <div>
                  <h2 className="dash-section-title">Claim & Verify Your SaaS Company</h2>
                  <p className="dash-section-sub">
                    Are you the founder or executive of a listed software company? Claim your official profile to edit revenue metrics, badge your page, and receive qualified buyer/investor inquiries.
                  </p>
                </div>
              </div>

              <div className="claim-card">
                <form onSubmit={handleClaimSubmit} className="claim-form">
                  <div className="claim-grid-2">
                    <div className="form-group">
                      <label className="form-label">SaaS Company Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Acme Cloud Inc"
                        value={claimForm.name}
                        onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Official Website Domain</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. acme.com"
                        value={claimForm.website}
                        onChange={(e) => setClaimForm({ ...claimForm, website: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="claim-grid-3">
                    <div className="form-group">
                      <label className="form-label">Current ARR ($USD)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. $4,200,000"
                        value={claimForm.arr}
                        onChange={(e) => setClaimForm({ ...claimForm, arr: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Team Headcount</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 28"
                        value={claimForm.team}
                        onChange={(e) => setClaimForm({ ...claimForm, team: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Capital Raised</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Bootstrapped or $2.5M"
                        value={claimForm.funding}
                        onChange={(e) => setClaimForm({ ...claimForm, funding: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Work Email (Must match company domain)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="founder@acme.com"
                      value={claimForm.founderEmail}
                      onChange={(e) => setClaimForm({ ...claimForm, founderEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Notes / Stripe Snapshot Link (Optional)</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder="Provide Stripe billing link, Carta statement, or official press release for fast-track verification..."
                      value={claimForm.note}
                      onChange={(e) => setClaimForm({ ...claimForm, note: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary claim-submit-btn"
                    disabled={claimSubmitting}
                  >
                    {claimSubmitting ? "Submitting Audit Request..." : "Submit Company Claim for Verification →"}
                  </button>
                </form>
              </div>

              {/* Active Verification Requests List */}
              <div style={{ marginTop: "28px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--text-main)" }}>
                  Your Verification & Audit Tickets ({submittedClaims.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {submittedClaims.map((claim) => (
                    <div
                      key={claim.ticket}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <b style={{ fontSize: "14px" }}>{claim.name}</b>
                          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>({claim.website})</span>
                          <span className="pill-neutral" style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                            {claim.ticket}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Reported ARR: <b>{claim.arr}</b> · Submitted on {claim.date}
                        </div>
                      </div>
                      <div>
                        <span
                          style={{
                            background: "var(--gold-bg)",
                            color: "var(--gold)",
                            border: "1px solid var(--gold)",
                            borderRadius: "20px",
                            padding: "4px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          ⏳ {claim.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BILLING & PLAN */}
          {activeTab === "billing" && (
            <div className="dash-tab-content">
              <div className="dash-section-header">
                <div>
                  <h2 className="dash-section-title">Subscription & Usage Limits</h2>
                  <p className="dash-section-sub">
                    Manage your active plan, lead download credits, and billing receipt invoices.
                  </p>
                </div>
              </div>

              <div className="billing-grid">
                <div className="billing-plan-card current">
                  <div className="plan-tag current">ACTIVE TIER</div>
                  <h3 className="plan-tier-name">RevAtlas Pro</h3>
                  <div className="plan-tier-price">
                    <span className="price-num">$29</span>
                    <span className="price-per">/month</span>
                  </div>
                  <ul className="plan-perks-list">
                    <li>✓ 100 Lead Export Credits per month</li>
                    <li>✓ Full 72,000+ Verified SaaS balance sheets</li>
                    <li>✓ 10,000 Programmatic REST API requests / day</li>
                    <li>✓ Real-time revenue & valuation webhook alerts</li>
                    <li>✓ Verified founder contact emails</li>
                  </ul>
                  <button
                    type="button"
                    className="btn-secondary btn-full"
                    onClick={() => showToast("Opening Stripe billing portal...", "info")}
                  >
                    Manage Payment Method (Stripe) ↗
                  </button>
                </div>

                <div className="billing-plan-card upgrade">
                  <div className="plan-tag upgrade">SCALE TEAMS</div>
                  <h3 className="plan-tier-name">RevAtlas Enterprise</h3>
                  <div className="plan-tier-price">
                    <span className="price-num">$99</span>
                    <span className="price-per">/month</span>
                  </div>
                  <ul className="plan-perks-list">
                    <li>✓ Unlimited monthly lead CSV exports</li>
                    <li>✓ Unlimited REST API queries with SLA</li>
                    <li>✓ Custom CRM integration sync (HubSpot, Salesforce)</li>
                    <li>✓ 5 Team member seats included</li>
                    <li>✓ Priority 1-on-1 revenue audit support</li>
                  </ul>
                  <button
                    type="button"
                    className="btn-primary btn-full"
                    onClick={() => showToast("Upgraded to Enterprise! Invoice generated.", "success")}
                  >
                    Upgrade to Enterprise Tier →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
