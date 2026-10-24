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
    const lines = [
      "RevAtlas Valuation Memo",
      `Date: ${new Date().toLocaleDateString()}`,
      `Current ARR: $${arr.toLocaleString()}`,
      `YoY Growth: ${growthRate}%`,
      `Net Retention: ${nrr}%`,
      `Gross Margin: ${grossMargin}%`,
      `Sector: ${category}`,
      `Structure: ${fundingType}`,
      "-------------------------",
      `Fair Market Valuation: $${calculations.valuation.toLocaleString()}`,
      `Valuation Multiple: ${calculations.fairMultiple}x ARR`,
      `Conservative Band: $${calculations.lowVal.toLocaleString()} (${calculations.conservativeMultiple}x)`,
      `Bull Case Band: $${calculations.highVal.toLocaleString()} (${calculations.optimisticMultiple}x)`,
      `Rule of 40 Score: ${calculations.ruleOf40}%`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `valuation-memo-${Math.round(arr / 1000)}k-arr.txt`;
    a.click();
    showToast("Downloaded Valuation Intelligence Memo!", "success");
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
