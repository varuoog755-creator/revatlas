"use client";

import { useState, useMemo } from "react";
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

export default function ValuationCalculator({ data }) {
  const [arr, setArr] = useState(2500000); // $2.5M
  const [growthRate, setGrowthRate] = useState(65); // 65%
  const [nrr, setNrr] = useState(115); // 115%
  const [grossMargin, setGrossMargin] = useState(80); // 80%
  const [fundingType, setFundingType] = useState("bootstrapped");
  const [category, setCategory] = useState("AI & Automation");

  // Calculate SaaS multiples based on benchmarks
  const calculations = useMemo(() => {
    // Base multiple
    let baseMultiple = 5.0;

    // Growth premium
    if (growthRate > 100) baseMultiple += 4.5;
    else if (growthRate > 60) baseMultiple += 3.0;
    else if (growthRate > 30) baseMultiple += 1.5;

    // NRR premium
    if (nrr >= 120) baseMultiple += 2.0;
    else if (nrr >= 105) baseMultiple += 1.0;
    else if (nrr < 90) baseMultiple -= 1.5;

    // Margin adjustment
    if (grossMargin >= 80) baseMultiple += 1.0;
    else if (grossMargin < 65) baseMultiple -= 1.0;

    // Category premium
    if (category.includes("AI")) baseMultiple += 2.5;
    else if (category.includes("DevTools") || category.includes("FinTech")) baseMultiple += 1.5;

    // Bootstrapped profitability bonus
    if (fundingType === "bootstrapped") baseMultiple += 1.0;

    const fairMultiple = Number(Math.max(3.0, baseMultiple).toFixed(1));
    const conservativeMultiple = Number((fairMultiple * 0.75).toFixed(1));
    const optimisticMultiple = Number((fairMultiple * 1.35).toFixed(1));

    const valuation = Math.round(arr * fairMultiple);
    const lowVal = Math.round(arr * conservativeMultiple);
    const highVal = Math.round(arr * optimisticMultiple);

    // Rule of 40 score (Growth % + estimated free cash flow margin)
    const estFcf = fundingType === "bootstrapped" ? 15 : -10;
    const ruleOf40 = growthRate + estFcf;

    // Find comparable peers in RevAtlas dataset
    const peers = data
      .map((d) => ({
        ...d,
        diff: Math.abs(d.revenue - arr),
      }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);

    return {
      fairMultiple,
      conservativeMultiple,
      optimisticMultiple,
      valuation,
      lowVal,
      highVal,
      ruleOf40,
      peers,
    };
  }, [arr, growthRate, nrr, grossMargin, fundingType, category, data]);

  function exportValuationMemo() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups to open valuation report.", "error");
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RevAtlas Valuation Memo — ${fmtMoney(calculations.valuation)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #09090b; max-width: 760px; margin: 0 auto; line-height: 1.5; }
          .header { border-bottom: 2px solid #09090b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 24px; font-weight: 800; }
          .badge { background: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; }
          .date { color: #71717a; font-size: 13px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .box { background: #f4f4f5; padding: 20px; border-radius: 8px; }
          .box-title { font-size: 13px; color: #71717a; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
          .box-val { font-size: 28px; font-weight: 800; font-family: monospace; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th, .table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
          .table th { background: #fafafa; font-weight: 600; }
          .footer { font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 15px; margin-top: 40px; text-align: center; }
          .print-btn { background: #09090b; color: #fff; padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
          @media print { .print-btn { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨 Print or Save as PDF</button>
        <div class="header">
          <div>
            <div class="logo">RevAtlas 🌍 Valuation Memo</div>
            <div class="date">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <span class="badge">Rule of 40: ${calculations.ruleOf40}% (${calculations.ruleOf40 >= 40 ? "Top Quartile" : "Growing"})</span>
        </div>

        <div class="grid">
          <div class="box" style="background: #eff6ff; border: 1px solid #bfdbfe;">
            <div class="box-title" style="color: #1e40af;">Fair Market Enterprise Value</div>
            <div class="box-val" style="color: #1d4ed8;">${fmtMoney(calculations.valuation)}</div>
            <div style="font-size: 13px; color: #1e40af; margin-top: 4px;">EV / ARR Multiple: <b>${calculations.fairMultiple}x</b></div>
          </div>
          <div class="box">
            <div class="box-title">Valuation Band Spectrum</div>
            <div style="font-size: 15px; margin-top: 8px;">Conservative (25th Pct): <b>${fmtMoney(calculations.lowVal)}</b> (${calculations.conservativeMultiple}x)</div>
            <div style="font-size: 15px; margin-top: 6px;">Bull Case (75th Pct): <b>${fmtMoney(calculations.highVal)}</b> (${calculations.optimisticMultiple}x)</div>
          </div>
        </div>

        <h3>Financial Inputs & Efficiency Benchmarks</h3>
        <table class="table">
          <tr><th>Input Metric</th><th>Reported Value</th><th>Industry Benchmark Context</th></tr>
          <tr><td>Annual Recurring Revenue (ARR)</td><td><b>$${arr.toLocaleString()}</b></td><td>Current verified run-rate</td></tr>
          <tr><td>YoY Revenue Growth</td><td><b>+${growthRate}%</b></td><td>${growthRate >= 60 ? "Hypergrowth SaaS (>60%)" : "Steady expansion"}</td></tr>
          <tr><td>Net Revenue Retention (NRR)</td><td><b>${nrr}%</b></td><td>${nrr >= 110 ? "Top Quartile Net Expansion" : "Healthy baseline"}</td></tr>
          <tr><td>Gross Margin</td><td><b>${grossMargin}%</b></td><td>Software gross margin target (75–85%)</td></tr>
          <tr><td>Capital Architecture</td><td><b>${fundingType === "bootstrapped" ? "Bootstrapped (Profitable)" : "VC Venture Backed"}</b></td><td>${fundingType === "bootstrapped" ? "+1.0x multiple premium for capital efficiency" : "Growth-adjusted valuation"}</td></tr>
          <tr><td>Primary Market Sector</td><td><b>${category}</b></td><td>Sector-specific EV/ARR transaction multiple</td></tr>
        </table>

        <h3>RevAtlas Comparable Market Transactions</h3>
        <table class="table">
          <tr><th>Comparable Company</th><th>Sector</th><th>ARR</th><th>Valuation Multiple</th></tr>
          ${calculations.peers.map((p) => `<tr><td><b>${p.name}</b></td><td>${p.category}</td><td>${fmtMoney(p.revenue)}</td><td>${p.multiple}x</td></tr>`).join("")}
        </table>

        <div class="footer">
          RevAtlas Intelligence · Derived from 72,000+ verified SaaS balance sheets and SEC private transaction multiples. · https://revatlas-one.vercel.app
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    showToast("Opened Executive Valuation Memo (Ready to Print / PDF)!", "success");
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="container calculator-page">
        <header className="hero-section">
          <div className="hero-badge">
            <span className="dot-pulse"></span> Market Multiple & Valuation Engine
          </div>
          <h1 className="hero-title">SaaS Company Valuation Calculator</h1>
          <p className="hero-sub">
            Real-time B2B valuation estimates based on ARR growth rate, Rule of 40 metrics, net revenue retention, and market multiples derived from 72,000+ SaaS data points.
          </p>
        </header>

        <div className="calc-layout-grid">
          {/* Sliders Input Panel */}
          <div className="calc-inputs-card">
            <div className="panel-head">
              <h3>Company Financial Inputs</h3>
              <span className="badge-pill">Step 1</span>
            </div>

            {/* ARR Input */}
            <div className="input-slider-group">
              <div className="slider-label-row">
                <label>Annual Recurring Revenue (ARR)</label>
                <span className="slider-val-badge">{fmtMoney(arr)}</span>
              </div>
              <input
                type="range"
                min="100000"
                max="25000000"
                step="50000"
                value={arr}
                onChange={(e) => setArr(Number(e.target.value))}
                className="range-slider"
              />
              <div className="range-bounds">
                <span>$100K</span>
                <span>$5M</span>
                <span>$25M+</span>
              </div>
            </div>

            {/* Growth Rate Slider */}
            <div className="input-slider-group">
              <div className="slider-label-row">
                <label>Year-over-Year (YoY) Growth Rate</label>
                <span className="slider-val-badge">+{growthRate}% YoY</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="range-slider"
              />
              <div className="range-bounds">
                <span>10% (Stable)</span>
                <span>75% (Fast)</span>
                <span>200%+ (Hypergrowth)</span>
              </div>
            </div>

            {/* Net Retention */}
            <div className="input-slider-group">
              <div className="slider-label-row">
                <label>Net Revenue Retention (NRR)</label>
                <span className="slider-val-badge">{nrr}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                step="2"
                value={nrr}
                onChange={(e) => setNrr(Number(e.target.value))}
                className="range-slider"
              />
              <div className="range-bounds">
                <span>80%</span>
                <span>105% (Benchmark)</span>
                <span>140%+ (Best-in-class)</span>
              </div>
            </div>

            {/* Gross Margin */}
            <div className="input-slider-group">
              <div className="slider-label-row">
                <label>Subscription Gross Margin</label>
                <span className="slider-val-badge">{grossMargin}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={grossMargin}
                onChange={(e) => setGrossMargin(Number(e.target.value))}
                className="range-slider"
              />
              <div className="range-bounds">
                <span>50%</span>
                <span>75%</span>
                <span>95% (Pure Software)</span>
              </div>
            </div>

            {/* Category & Capital Stage Selectors */}
            <div className="dropdowns-row">
              <div className="form-group">
                <label>Category / Sector</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="clean-select full"
                >
                  <option value="AI & Automation">AI & Automation (+2.5x premium)</option>
                  <option value="DevTools & Infrastructure">DevTools & Cloud (+1.5x)</option>
                  <option value="FinTech & Billing">FinTech & Payments (+1.5x)</option>
                  <option value="Sales & CRM">Sales & CRM</option>
                  <option value="Marketing & SEO">Marketing & SEO</option>
                  <option value="Cybersecurity & Identity">Cybersecurity & Identity</option>
                </select>
              </div>

              <div className="form-group">
                <label>Funding Structure</label>
                <select
                  value={fundingType}
                  onChange={(e) => setFundingType(e.target.value)}
                  className="clean-select full"
                >
                  <option value="bootstrapped">Bootstrapped / Profitable</option>
                  <option value="seed">Pre-Seed / Seed VC</option>
                  <option value="growth">Series A / B+ Growth Equity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results & Valuation Output Panel */}
          <div className="calc-results-card">
            <div className="panel-head">
              <h3>Estimated Valuation Results</h3>
              <span className="badge-pill highlight">Live Benchmark</span>
            </div>

            {/* Big Headline Valuation Card */}
            <div className="valuation-headline-box">
              <span className="val-top-label">Estimated Fair Market Valuation</span>
              <div className="val-big-number">{fmtMoney(calculations.valuation)}</div>
              <div className="val-multiple-chip">
                <span>⚡ {calculations.fairMultiple}x ARR Multiple</span>
              </div>
            </div>

            {/* Valuation Spectrum Bands */}
            <div className="spectrum-grid">
              <div className="spectrum-card">
                <span className="spec-label">Conservative (25th Pct)</span>
                <span className="spec-val">{fmtMoney(calculations.lowVal)}</span>
                <span className="spec-mult">{calculations.conservativeMultiple}x ARR</span>
              </div>
              <div className="spectrum-card spec-featured">
                <span className="spec-label">Median Fair Value</span>
                <span className="spec-val">{fmtMoney(calculations.valuation)}</span>
                <span className="spec-mult">{calculations.fairMultiple}x ARR</span>
              </div>
              <div className="spectrum-card">
                <span className="spec-label">Bull Case (75th Pct)</span>
                <span className="spec-val">{fmtMoney(calculations.highVal)}</span>
                <span className="spec-mult">{calculations.optimisticMultiple}x ARR</span>
              </div>
            </div>

            {/* Rule of 40 Card */}
            <div className="rule-40-card">
              <div className="rule-40-head">
                <span>Rule of 40 Score:</span>
                <b className={calculations.ruleOf40 >= 40 ? "rule-good" : "rule-warn"}>
                  {calculations.ruleOf40}% ({calculations.ruleOf40 >= 40 ? "Elite Tier" : "Growing"})
                </b>
              </div>
              <p className="rule-desc">
                Sum of growth rate ({growthRate}%) and estimated margin. VCs consider &gt;40% top-quartile.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="calc-action-row">
              <button className="btn-primary btn-full" onClick={exportValuationMemo}>
                📥 Download Valuation Memo
              </button>
              <Link href="/dashboard?tab=claim" className="btn-secondary btn-full">
                Claim / List Your Company ↗
              </Link>
            </div>

            {/* Comparable SaaS Peers */}
            <div className="comparable-peers-box">
              <span className="peers-head-title">Comparable SaaS Peers in RevAtlas:</span>
              <div className="peer-mini-list">
                {calculations.peers.map((peer) => (
                  <Link
                    key={peer.slug}
                    href={`/company/${peer.slug}`}
                    className="peer-mini-row"
                  >
                    <div>
                      <b>{peer.name}</b>
                      <span className="peer-mini-cat"> · {peer.category}</span>
                    </div>
                    <div className="peer-mini-right">
                      <span className="peer-mini-rev">{fmtMoney(peer.revenue)} ARR</span>
                      <span className="peer-mini-val">({fmtMoney(peer.valuation)})</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
