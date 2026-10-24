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

export default function CustomerDashboard({ initialData = [] }) {
  const [activeTab, setActiveTab] = useState("saved");
  const [savedIds, setSavedIds] = useState([]);
  const [exportHistory, setExportHistory] = useState([
    { id: 1, date: "24 Oct 2026, 14:35", name: "US-SaaS-$1M-plus.csv", rows: 45, filter: "Rev > $1M, US Only" },
    { id: 2, date: "23 Oct 2026, 19:10", name: "Funded-Seed-SaaS.csv", rows: 88, filter: "Funded only, Founded 2020+" },
    { id: 3, date: "22 Oct 2026, 11:05", name: "AI-Workflow-Leads.csv", rows: 32, filter: "AI & Automation" },
  ]);
  const [claimForm, setClaimForm] = useState({
    name: "",
    website: "",
    arr: "",
    team: "",
    funding: "",
    founderEmail: "",
    note: "",
  });
  const [claimStatus, setClaimStatus] = useState("");
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // API Playground State
  const [apiEndpoint, setApiEndpoint] = useState("/v1/companies?limit=3");
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState("https://api.yourcrm.com/webhooks/revatlas");
  const [webhookStatus, setWebhookStatus] = useState("");

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
      if (tabParam && ["saved", "exports", "claim", "api", "webhooks", "billing"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const savedCompanies = initialData.filter((item) =>
    savedIds.includes(item.slug || item.website || item.name)
  );

  function removeSaved(id) {
    const next = savedIds.filter((item) => item !== id);
    setSavedIds(next);
    localStorage.setItem("revatlas_saved_companies", JSON.stringify(next));
    showToast("Removed from watchlist", "info");
  }

  function exportSavedCSV() {
    if (savedCompanies.length === 0) return;
    const header = ["Name", "Website", "Revenue", "Valuation", "GrowthRate", "Category", "Funding", "Founder", "Team", "Location"];
    const lines = [header.join(",")];
    for (const r of savedCompanies) {
      lines.push(
        [r.name, r.website, r.revenue ?? "", r.valuation ?? "", `${r.growthRate}%`, r.category, r.funding ?? "", r.founder ?? "", r.team ?? "", r.location ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `watchlist-leads-${savedCompanies.length}.csv`;
    a.click();

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      name: `watchlist-leads-${savedCompanies.length}.csv`,
      rows: savedCompanies.length,
      filter: "Saved Watchlist",
    };
    setExportHistory((prev) => [newEntry, ...prev]);
    showToast(`Exported ${savedCompanies.length} leads to CSV!`, "success");
  }

  function handleClaimSubmit(e) {
    e.preventDefault();
    if (!claimForm.name || !claimForm.website) return;
    setClaimStatus("Submitting...");
    setTimeout(() => {
      setClaimStatus("Success! Your SaaS submission is under review by RevAtlas audit team.");
      setClaimForm({ name: "", website: "", arr: "", team: "", funding: "", founderEmail: "", note: "" });
      showToast("Company profile submitted for verification!", "success");
    }, 600);
  }

  function copyApiKey() {
    navigator.clipboard?.writeText("rev_live_948f2b79a103c847e92");
    setApiKeyCopied(true);
    showToast("API Secret Key copied to clipboard!", "success");
    setTimeout(() => setApiKeyCopied(false), 2000);
  }

  function runApiPlayground() {
    setApiLoading(true);
    setTimeout(() => {
      setApiLoading(false);
      let res;
      if (apiEndpoint.includes("limit=3")) {
        res = {
          status: 200,
          total_results: initialData.length,
          data: initialData.slice(0, 3).map((c) => ({
            name: c.name,
            website: c.website,
            arr: c.revenue,
            mrr: c.mrr,
            valuation: c.valuation,
            category: c.category,
            founder: c.founder,
          })),
        };
      } else {
        const item = initialData[0];
        res = {
          status: 200,
          data: {
            name: item.name,
            website: item.website,
            arr: item.revenue,
            valuation: item.valuation,
            growth_rate_yoy: `${item.growthRate}%`,
            tech_stack: item.techStack,
            founder: item.founder,
          },
        };
      }
      setApiResponse(res);
      showToast("HTTP 200 OK — API Response Received", "success");
    }, 450);
  }

  function testWebhook() {
    setWebhookStatus("Sending test event to " + webhookUrl + "...");
    setTimeout(() => {
      setWebhookStatus("✓ Webhook delivered successfully! (HTTP 200 response from endpoint)");
      showToast("Test webhook ping delivered!", "success");
    }, 800);
  }

  return (
    <div className="app-shell">
      <Navbar savedCount={savedIds.length} />

      <main className="dashboard-container">
        {/* Customer Header */}
        <div className="dash-hero">
          <div className="dash-hero-content">
            <div className="badge-pill">Customer Portal</div>
            <h1>Lead Intelligence & API Workspace</h1>
            <p className="sub-text">
              Track prospect watchlists, manage export quotas, test programmatic REST API calls, and configure automated revenue alert webhooks.
            </p>
          </div>
          <div className="plan-card">
            <div className="plan-header">
              <span className="plan-badge">⚡ Pro Member Tier</span>
              <span className="plan-price">$29/mo</span>
            </div>
            <div className="plan-progress">
              <div className="progress-labels">
                <span>Monthly Export Credits</span>
                <b>12 / Unlimited (Pro)</b>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "25%" }}></div>
              </div>
            </div>
            <button className="btn-secondary btn-full btn-sm" onClick={() => setActiveTab("billing")}>
              Manage Billing & Invoices
            </button>
          </div>
        </div>

        {/* Quick Stat Tiles */}
        <section className="kpi-grid">
          <div className="kpi-tile" onClick={() => setActiveTab("saved")} role="button" tabIndex={0}>
            <div className="kpi-header">
              <span className="kpi-icon">📌</span>
              <span className="kpi-tag">Watchlist</span>
            </div>
            <div className="kpi-value">{savedCompanies.length}</div>
            <div className="kpi-desc">Saved SaaS Leads for outreach</div>
          </div>

          <div className="kpi-tile" onClick={() => setActiveTab("exports")} role="button" tabIndex={0}>
            <div className="kpi-header">
              <span className="kpi-icon">📥</span>
              <span className="kpi-tag">Activity</span>
            </div>
            <div className="kpi-value">{exportHistory.length}</div>
            <div className="kpi-desc">Total CSV Export Batches</div>
          </div>

          <div className="kpi-tile" onClick={() => setActiveTab("api")} role="button" tabIndex={0}>
            <div className="kpi-header">
              <span className="kpi-icon">⚡</span>
              <span className="kpi-tag">Live API</span>
            </div>
            <div className="kpi-value">42 / 10,000</div>
            <div className="kpi-desc">Daily API requests used</div>
          </div>

          <div className="kpi-tile" onClick={() => setActiveTab("webhooks")} role="button" tabIndex={0}>
            <div className="kpi-header">
              <span className="kpi-icon">🔔</span>
              <span className="kpi-tag">Webhooks</span>
            </div>
            <div className="kpi-value">Active</div>
            <div className="kpi-desc">Real-time revenue event stream</div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="dash-tabs">
          <button
            className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            📌 Saved Watchlist ({savedCompanies.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "exports" ? "active" : ""}`}
            onClick={() => setActiveTab("exports")}
          >
            📥 Export History
          </button>
          <button
            className={`tab-btn ${activeTab === "api" ? "active" : ""}`}
            onClick={() => setActiveTab("api")}
          >
            🔑 API Playground & Keys
          </button>
          <button
            className={`tab-btn ${activeTab === "webhooks" ? "active" : ""}`}
            onClick={() => setActiveTab("webhooks")}
          >
            🔔 Webhooks & Alerts
          </button>
          <button
            className={`tab-btn ${activeTab === "claim" ? "active" : ""}`}
            onClick={() => setActiveTab("claim")}
          >
            🏢 Claim / Submit SaaS
          </button>
          <button
            className={`tab-btn ${activeTab === "billing" ? "active" : ""}`}
            onClick={() => setActiveTab("billing")}
          >
            💳 Billing & Plan
          </button>
        </div>

        {/* Tab 1: Saved Leads */}
        {activeTab === "saved" && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h2>Your Saved SaaS Companies</h2>
                <p className="pane-sub">
                  Bookmarked prospects from the RevAtlas directory. Ready for cold email or partnership outreach.
                </p>
              </div>
              {savedCompanies.length > 0 && (
                <div className="btn-group">
                  <button className="btn-primary" onClick={exportSavedCSV}>
                    ⬇ Export Watchlist (CSV)
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
              <div className="empty-box">
                <div className="empty-icon">📂</div>
                <h3>Your watchlist is empty</h3>
                <p>
                  Browse the SaaS Atlas directory and click the <b>Bookmark (☆)</b> icon on any company row to save it here.
                </p>
                <Link href="/" className="btn-primary">
                  Browse 72,000+ SaaS Directory
                </Link>
              </div>
            ) : (
              <div className="table-card">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Category</th>
                      <th>ARR (Revenue)</th>
                      <th>Valuation</th>
                      <th>Team</th>
                      <th>Founder</th>
                      <th>Location</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCompanies.map((c) => (
                      <tr key={c.slug || c.website || c.name}>
                        <td>
                          <div className="company-title-cell">
                            <Link href={`/company/${c.slug}`} className="cname-link">
                              <b>{c.name}</b> ↗
                            </Link>
                            {c.website && (
                              <a
                                href={`https://${c.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="external-link"
                              >
                                {c.website}
                              </a>
                            )}
                          </div>
                        </td>
                        <td><span className="pill-neutral">{c.category}</span></td>
                        <td>
                          <span className="rev-badge">{fmtMoney(c.revenue)}</span>
                        </td>
                        <td>{fmtMoney(c.valuation)}</td>
                        <td>{c.team ? `${c.team} people` : "–"}</td>
                        <td>{c.founder || "–"}</td>
                        <td>{c.location || "–"}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn-text-danger"
                            onClick={() => removeSaved(c.slug || c.website || c.name)}
                            title="Remove from watchlist"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Export History */}
        {activeTab === "exports" && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h2>CSV Lead Export History</h2>
                <p className="pane-sub">
                  Past CSV lead lists generated from RevAtlas. Re-download any past dataset snapshot.
                </p>
              </div>
            </div>

            <div className="table-card">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Date & Time</th>
                    <th>Records</th>
                    <th>Filter Applied</th>
                    <th>Format</th>
                    <th style={{ textAlign: "right" }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map((item) => (
                    <tr key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.date}</td>
                      <td><span className="pill-neutral">{item.rows} leads</span></td>
                      <td>{item.filter}</td>
                      <td>CSV (UTF-8)</td>
                      <td style={{ textAlign: "right" }}>
                        <button
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

        {/* Tab 3: API Playground & Keys */}
        {activeTab === "api" && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h2>Programmatic REST API & Live Playground</h2>
                <p className="pane-sub">
                  Query verified revenue, founder contacts, and company metrics directly inside your applications.
                </p>
              </div>
            </div>

            <div className="api-card">
              <div className="api-key-block">
                <div>
                  <div className="label-sm">Active API Secret Key (Bearer Auth)</div>
                  <code className="api-code">rev_live_948f2b79a103c847e92</code>
                </div>
                <button className="btn-secondary btn-sm" onClick={copyApiKey}>
                  {apiKeyCopied ? "✓ Copied!" : "Copy Key"}
                </button>
              </div>

              {/* Interactive Live Playground */}
              <div className="api-playground-box">
                <div className="panel-head">
                  <h3>Interactive API Request Builder</h3>
                  <span className="badge-pill">Test Console</span>
                </div>
                <div className="playground-bar">
                  <span className="http-method">GET</span>
                  <input
                    className="playground-url-input"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                  />
                  <button className="btn-primary" onClick={runApiPlayground} disabled={apiLoading}>
                    {apiLoading ? "Sending..." : "Send Request ⚡"}
                  </button>
                </div>

                {apiResponse && (
                  <div className="api-response-viewer">
                    <div className="response-header">
                      <span className="res-badge">HTTP 200 OK</span>
                      <span className="res-latency">42ms response latency</span>
                    </div>
                    <pre className="code-snippet json-code">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="code-example-section">
                <h3>cURL Shell Example</h3>
                <pre className="code-snippet">
{`curl -X GET "https://api.revatlas.com/v1/companies?category=AI&min_revenue=1000000" \\
  -H "Authorization: Bearer rev_live_948f2b79a103c847e92"`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Webhooks & Event Alerts */}
        {activeTab === "webhooks" && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h2>Real-Time SaaS Event Webhooks</h2>
                <p className="pane-sub">
                  Receive instant HTTP POST alerts when companies in your watchlist hit revenue milestones or raise new funding.
                </p>
              </div>
            </div>

            <div className="form-card">
              <div className="form-group">
                <label>Target Webhook Endpoint URL</label>
                <div className="webhook-input-row">
                  <input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-crm.com/api/webhooks"
                  />
                  <button className="btn-secondary" onClick={testWebhook}>
                    Send Test Ping
                  </button>
                </div>
                {webhookStatus && <div className="alert-box alert-success">{webhookStatus}</div>}
              </div>

              <div className="webhook-events-list">
                <h4>Subscribed Event Triggers:</h4>
                <label className="checkbox-pill full-mb">
                  <input type="checkbox" defaultChecked />
                  <span><b>revenue.milestone_hit</b> (Company reaches $1M, $5M, or $10M ARR)</span>
                </label>
                <label className="checkbox-pill full-mb">
                  <input type="checkbox" defaultChecked />
                  <span><b>funding.round_announced</b> (Seed, Series A/B funding disclosure)</span>
                </label>
                <label className="checkbox-pill full-mb">
                  <input type="checkbox" defaultChecked />
                  <span><b>executive.leadership_change</b> (New CEO / Founder appointment)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Claim / Submit SaaS */}
        {activeTab === "claim" && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h2>Claim or Submit Your SaaS Listing</h2>
                <p className="pane-sub">
                  Get your software featured across 72,000+ listings. Verified profiles receive higher trust and direct buyer inbound.
                </p>
              </div>
            </div>

            <div className="form-card">
              {claimStatus && (
                <div className={`alert-box ${claimStatus.startsWith("Success") ? "alert-success" : "alert-info"}`}>
                  {claimStatus}
                </div>
              )}

              <form onSubmit={handleClaimSubmit} className="grid-form">
                <div className="form-group">
                  <label>SaaS Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Cloud"
                    value={claimForm.name}
                    onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Website URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. acme.com"
                    value={claimForm.website}
                    onChange={(e) => setClaimForm({ ...claimForm, website: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Current Annual Recurring Revenue (ARR)</label>
                  <input
                    type="text"
                    placeholder="e.g. $1.5M ARR"
                    value={claimForm.arr}
                    onChange={(e) => setClaimForm({ ...claimForm, arr: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total Team Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 18"
                    value={claimForm.team}
                    onChange={(e) => setClaimForm({ ...claimForm, team: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total Funding Raised</label>
                  <input
                    type="text"
                    placeholder="e.g. Bootstrapped / $750K Angel"
                    value={claimForm.funding}
                    onChange={(e) => setClaimForm({ ...claimForm, funding: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Founder / Business Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="founder@acme.com"
                    value={claimForm.founderEmail}
                    onChange={(e) => setClaimForm({ ...claimForm, founderEmail: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Short Pitch & Key Differentiator</label>
                  <textarea
                    rows={3}
                    placeholder="What problem does your SaaS solve and for whom?"
                    value={claimForm.note}
                    onChange={(e) => setClaimForm({ ...claimForm, note: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-actions full-width">
                  <button type="submit" className="btn-primary">
                    Submit Listing for Free Verification
                  </button>
                  <span className="hint-text">Approval takes ~24 hours. No fee required.</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 6: Billing & Plan */}
        {activeTab === "billing" && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h2>Subscription & License Management</h2>
                <p className="pane-sub">Manage your plan, download past invoices, and modify payment methods.</p>
              </div>
            </div>

            <div className="billing-summary-card">
              <div className="bill-plan-info">
                <div>
                  <span className="badge-pill highlight">Active Plan</span>
                  <h3>Pro Growth Member ($29 / month)</h3>
                  <p>Next billing cycle renews on November 24, 2026 via Visa ending in 4242.</p>
                </div>
                <div className="btn-group">
                  <button className="btn-secondary" onClick={() => showToast("Invoice #INV-2026-10 downloaded!", "success")}>
                    📥 Download Latest Invoice
                  </button>
                  <Link href="/pricing" className="btn-primary">
                    Change Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
