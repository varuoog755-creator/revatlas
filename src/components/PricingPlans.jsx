"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import { showToast } from "./Toast";

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState("annual"); // "annual" or "monthly"
  const [checkoutTier, setCheckoutTier] = useState(null); // opens modal when set
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  function handleCheckout(tierName, basePrice) {
    setCheckoutTier({ name: tierName, price: basePrice });
  }

  function applyPromo() {
    if (promoCode.trim().toUpperCase() === "LAUNCH50") {
      setDiscountApplied(true);
      showToast("50% Launch Discount Applied!", "success");
    } else {
      showToast("Invalid coupon code. Try 'LAUNCH50'", "info");
    }
  }

  function completeOrder(e) {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutTier(null);
      showToast(`Congratulations! Upgraded to ${checkoutTier.name}!`, "success");
    }, 1200);
  }

  const proPrice = billingCycle === "annual" ? 24 : 29;
  const entPrice = billingCycle === "annual" ? 79 : 99;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="container pricing-page">
        <header className="hero-section center-hero">
          <div className="hero-badge">
            <span className="dot-pulse"></span> Transparent B2B SaaS Licensing
          </div>
          <h1 className="hero-title">Fair, Transparent Pricing for Growth Teams</h1>
          <p className="hero-sub max-center">
            Access verified revenue intelligence, executive emails, and programmatic API access. No hidden lock-in contracts, cancel anytime with one click.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="billing-toggle-wrap">
            <button
              className={`toggle-opt ${billingCycle === "monthly" ? "active" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly Billing
            </button>
            <button
              className={`toggle-opt ${billingCycle === "annual" ? "active" : ""}`}
              onClick={() => setBillingCycle("annual")}
            >
              Annual Billing <span className="discount-pill">Save 20%</span>
            </button>
          </div>
        </header>

        {/* Pricing Cards Grid */}
        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-card">
            <div className="pricing-header">
              <span className="tier-tag">Community</span>
              <h3>Starter Free</h3>
              <div className="price-tag">
                $0 <span>/ month</span>
              </div>
              <p className="tier-desc">For indie founders & bootstrappers exploring market demand.</p>
            </div>
            <ul className="perks-list">
              <li>✓ Full 72,000+ SaaS directory search</li>
              <li>✓ Advanced filters (ARR, founded, location)</li>
              <li>✓ 100 CSV export credits / month</li>
              <li>✓ Save up to 50 companies in Watchlist</li>
              <li>✓ 100 REST API calls / day</li>
              <li>✗ No founder direct verified emails</li>
              <li>✗ No webhook lead alerts</li>
            </ul>
            <Link href="/" className="btn-secondary btn-full">
              Get Started Free
            </Link>
          </div>

          {/* Pro Growth (Featured) */}
          <div className="pricing-card featured-plan">
            <div className="featured-ribbon">Most Popular for Growth</div>
            <div className="pricing-header">
              <span className="tier-tag highlight">Sales & Founders</span>
              <h3>Pro Growth</h3>
              <div className="price-tag">
                ${proPrice} <span>/ month</span>
              </div>
              <span className="billed-note">
                {billingCycle === "annual" ? "Billed $288 annually" : "Billed monthly"}
              </span>
              <p className="tier-desc">For sales reps, agencies & founders building cold outbound pipelines.</p>
            </div>
            <ul className="perks-list">
              <li>✓ <b>Unlimited CSV & JSON downloads</b></li>
              <li>✓ <b>Direct Verified Founder Emails & LinkedIn</b></li>
              <li>✓ Real-time revenue & funding alert webhooks</li>
              <li>✓ Unlimited custom Watchlists & lead tags</li>
              <li>✓ 10,000 programmatic API requests / day</li>
              <li>✓ Side-by-side comparison matrix exports</li>
              <li>✓ Priority Discord & email founder support</li>
            </ul>
            <button
              className="btn-primary btn-full"
              onClick={() => handleCheckout("Pro Growth", proPrice)}
            >
              Upgrade to Pro ({billingCycle === "annual" ? "$24/mo" : "$29/mo"})
            </button>
          </div>

          {/* Enterprise Data License */}
          <div className="pricing-card">
            <div className="pricing-header">
              <span className="tier-tag">VCs & Scaleups</span>
              <h3>Enterprise License</h3>
              <div className="price-tag">
                ${entPrice} <span>/ month</span>
              </div>
              <span className="billed-note">
                {billingCycle === "annual" ? "Billed $948 annually" : "Billed monthly"}
              </span>
              <p className="tier-desc">For VCs, private equity & data science teams needing bulk intelligence.</p>
            </div>
            <ul className="perks-list">
              <li>✓ <b>Full 72,000+ Raw Database Dump</b> (Postgres/CSV)</li>
              <li>✓ Monthly updated snapshot downloads</li>
              <li>✓ CRM 2-way sync (HubSpot, Salesforce)</li>
              <li>✓ Unlimited team seats & shared workspaces</li>
              <li>✓ Dedicated API with unlimited requests</li>
              <li>✓ Custom data extraction requests on demand</li>
              <li>✓ 99.99% uptime SLA & dedicated account rep</li>
            </ul>
            <button
              className="btn-secondary btn-full"
              onClick={() => handleCheckout("Enterprise License", entPrice)}
            >
              Start Enterprise Trial
            </button>
          </div>
        </div>

        {/* One-Time Lifetime Dump Banner */}
        <div className="lifetime-dump-banner">
          <div className="dump-banner-content">
            <span className="banner-badge">One-Time Lifetime Deal</span>
            <h3>Prefer an offline database dump instead of a subscription?</h3>
            <p>
              Get the complete 72,000+ SaaS raw dataset in Postgres SQL, CSV, and JSONL format. Includes revenue, valuation, tech stacks, and founder contact records.
            </p>
          </div>
          <div className="dump-banner-cta">
            <div className="dump-price">$149 <span>one-time</span></div>
            <button
              className="btn-primary"
              onClick={() => handleCheckout("Lifetime 72K Database Dump", 149)}
            >
              Buy Raw Database Dump ↗
            </button>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="faq-section">
          <div className="pane-header center-hero">
            <h2>Frequently Asked Questions</h2>
            <p className="pane-sub">Everything you need to know about RevAtlas data and commercial licensing.</p>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h4>Where does RevAtlas get its revenue and financial data?</h4>
              <p>
                Our dataset is aggregated from verified public SEC disclosures, SaaS founder interviews (GetLatka index), investor pitch decks, press releases, and self-reported founder claims audited by our research team.
              </p>
            </div>

            <div className="faq-item">
              <h4>Can I use the exported CSV leads in my CRM (HubSpot, Apollo, Lemlist)?</h4>
              <p>
                Yes! All exports include company names, clean websites, founder names, and verified work emails formatted specifically for 1-click import into HubSpot, Salesforce, Apollo, or Instantly.
              </p>
            </div>

            <div className="faq-item">
              <h4>Can I cancel my subscription at any time?</h4>
              <p>
                Yes, absolutely. You can cancel with a single click inside your Customer Dashboard under the "Billing" tab. You retain full access until the end of your billing cycle.
              </p>
            </div>

            <div className="faq-item">
              <h4>How often is company data updated?</h4>
              <p>
                Public listings and revenue milestones are refreshed continuously through our automated data pipelines. Verified profiles receive real-time updates when founders update their ARR.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutTier && (
        <div className="palette-backdrop" onClick={() => setCheckoutTier(null)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Upgrade to {checkoutTier.name}</h3>
                <span className="modal-price">
                  ${discountApplied ? Math.round(checkoutTier.price * 0.5) : checkoutTier.price} / period
                </span>
              </div>
              <button className="palette-close" onClick={() => setCheckoutTier(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={completeOrder} className="checkout-form">
              <div className="form-group">
                <label>Cardholder Name</label>
                <input required placeholder="Gourav Sharma" defaultValue="Gourav Sharma" />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input required placeholder="4242 •••• •••• 4242" defaultValue="4242 4242 4242 4242" />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input required placeholder="12/28" defaultValue="12/28" />
                </div>
                <div className="form-group">
                  <label>CVC / Security Code</label>
                  <input required placeholder="123" defaultValue="894" />
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="promo-row">
                <input
                  placeholder="Promo Code (try LAUNCH50)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={discountApplied}
                />
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={applyPromo}
                  disabled={discountApplied}
                >
                  {discountApplied ? "✓ Applied" : "Apply"}
                </button>
              </div>

              <div className="checkout-footer">
                <button type="submit" className="btn-primary btn-full" disabled={isProcessing}>
                  {isProcessing ? "Processing Secure Payment..." : `Confirm Payment ($${discountApplied ? Math.round(checkoutTier.price * 0.5) : checkoutTier.price})`}
                </button>
                <span className="secure-badge">🔒 256-Bit SSL Encrypted · Stripe / Razorpay Protected</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
