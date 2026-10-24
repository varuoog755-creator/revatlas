# RevAtlas 🌍 — The Revenue Atlas of SaaS

> Har SaaS company, uska revenue, funding aur team — ek jagah, search ke liye.

## Project Identity
| Field | Value |
|---|---|
| **Project name** | RevAtlas |
| **Domain** | revatlas.com ✅ (DNS pe free dikha; registrar pe purchase se confirm karo) |
| **Tagline** | "The Revenue Atlas of SaaS — 72,000+ companies, free to search" |
| **Positioning** | Free GetLatka alternative — lead-gen database for founders, sales teams, marketers |
| **Goes by** | RevAtlas (short: "Atlas") |

## Why this name works
- **Rev** = Revenue — humara differentiator (har listing pe ARR dikhta hai)
- **Atlas** = map/directory — poore SaaS world ka atlas
- Short, memorable, .com free, search/SEO me "Rev" keyword kaam aata hai

## What's inside (July 2026 status)
- Local Next.js app: search + filters + sort + CSV export (localhost:3000)
- Data pipeline: GetLatka public pages scrape via agent (leads.jsonl, resumable)
- Target dataset: 72,000+ SaaS companies (revenue, funding, valuation, founder, team, founded, location)

## Revenue model (planned)
1. Freemium — free search / paid CSV export ($19–49/mo)
2. One-time database dump ($29 Gumroad)
3. API access — free 100 req/day, paid unlimited
4. Featured listings ($99/mo) + affiliate tools block
5. "Claim your company" — companies self-verify & share (fresh data + free traffic)

## Roadmap
- [x] Scrape seed data (280 companies)
- [x] Rich B2B SaaS data enrichment (growth rates, multiples, tech stacks, categories)
- [x] UI migration to RevAtlas branding & Clean White Light / Dark Theme toggle
- [x] Programmatic Company Profiles with SVG Growth Charts (`/company/[slug]`)
- [x] Side-by-Side SaaS Comparison Engine (`/compare`)
- [x] SaaS Valuation & Multiple Calculator (`/calculator`)
- [x] Transparent Pricing & Checkout flow (`/pricing`)
- [x] Customer Dashboard & Interactive REST API Playground (`/dashboard`)
- [x] Command Palette (`Ctrl+K`) & Global Toast Notification System
- [x] Deploy live on Vercel (https://revatlas-one.vercel.app)
- [x] Deploy live on Cloudflare Pages (https://revatlas.pages.dev)
- [x] GitHub Repository (https://github.com/varuoog755-creator/revatlas)
- [ ] Payments Gateway Integration (Razorpay India / Stripe Global webhook)
- [ ] Product Hunt + Show HN launch campaign
