# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A two-sided marketplace; both sides are first-class.

- **Buyers** — private individuals buying a whole cask of maturing whisky (collectors, enthusiasts, people treating a cask as a long-hold asset). Their job: find a cask, check what they are actually buying, who owns it and what it costs, buy it, track it while it matures, then resell or bottle it.
- **Distilleries** — list casks they filled, at their own price, and manage listings, sales and verification.
- **Bonded warehouses** (role `facilitator`) — list casks they hold, issue/confirm delivery orders, and record transfers.
- **Administrators** — KYC review, distillery/warehouse verification, listings, orders and review moderation.

## Product Purpose

ARIGI is a curated marketplace for whole-cask whisky ownership. Every cask comes direct from the distillery that filled it or from an owner whose title has been checked, with provenance recorded on-chain. It exists because the private cask market is opaque: undisclosed markups, unverifiable ownership, missing delivery orders, seller-produced valuations and no real exit. Success means a buyer can check what they own, what they paid, and what it is worth, and a distillery can sell direct without a chain of intermediaries.

## Positioning

Built by bulk spirits traders (ISO tanks, IBCs, bonded warehouses across Europe) who brought the professional trade's documentation standard to private cask buying. Specific mechanisms a typical cask broker cannot truthfully claim:

- Only two doors in: direct from the distillery, or from a verified owner (ownership checked against ARIGI records and the warehouse before listing).
- Every cask minted as an NFT on Polygon before listing; the ownership record is public and independent of ARIGI.
- A delivery order is required on every transfer; a seller's certificate is not title.
- Asking price and all fees shown before purchase.
- No projected returns or "current market value" figures; ARIGI shows what casks actually sold for.
- Resale runs through the same open marketplace, not back through a broker.

## Operating Context

- Casks sit in licensed UK bonded warehouses, duty-suspended until bottled.
- Key documents and terms: delivery order, WOWGR, regauge, fill date, cask type, ABV, IPFS document hashes (CIDs) for provenance documents, block-explorer links.
- Buyer lifecycle: browse/compare/wishlist → offer or buy → payment → maturation tracking → resale or bottling (bottling, labelling, duty and shipping quoted before confirming; NFT marked redeemed after bottling).
- Distillery and warehouse lifecycles: onboarding → verification → list cask → sales/analytics.

## Capabilities and Constraints

- Stack (existing): Vite + React + TypeScript, Tailwind + shadcn/ui, Supabase (auth, Postgres with RLS, edge functions). Built and edited in Lovable (project 7a41cf81-dfb2-478b-9e01-dcdb07248a90), synced to GitHub `gvaneverdingen/barrel-burn-ledger`.
- Integrations present in code: Stripe (checkout, Stripe Connect for distilleries), Sumsub + in-house KYC, Magic wallet, Polygon NFT certificates, IPFS CIDs.
- Features present: marketplace with filters, cask detail with provenance timeline/transaction history/world map, comparison, wishlist, offers, price alerts, portfolio, resale, reports, insights and AI price tracker, notifications, documentation and help, role-based dashboards, currency selector, light/dark theme, mobile bottom nav, AI site-guide agent.
- Known incomplete (per roadmap.md): on-chain transfers untested because the platform wallet needs POL; Sumsub automatic results not yet shown in Admin → KYC.
- **Stage: pre-launch / demo.** Sample data only (16 casks, 4 distilleries, 0 trades). No real transactions yet.
- **Market: UK / Scotch first.** Open decision: the currency selector currently defaults to USD; GBP is the natural default for this market.

## Brand Commitments

- Name: ARIGI. Logo: `src/assets/arigi-logo.png`. (`angel-share-logo.png` / `angel-share-horizontal-logo.png` also exist in assets; their status is unconfirmed.)
- Voice (established on the Our Story page): plain, factual, trade-literate, and candid about the industry without naming or accusing companies. "It isn't glamorous. It's just verifiable." Explains documents rather than selling dreams.

## Evidence on Hand

- Real copy: Our Story page (`src/pages/About.tsx`) with the origin story, problems, principles and the provenance/fees FAQ.
- Photography: `src/assets/hero-cask-luxury.jpg`, `warehouse-hero.jpg`, `cask-detail.jpg`, `single-cask.jpg`, `marketplace-bg.jpg`, `public/og-image.jpg`.
- Absent, and must not be fabricated: real customers, testimonials, completed trades, partner distillery names presented as signed, press, returns or performance figures, licences or regulatory approvals not shown in code.

## Product Principles

1. **Verifiable over impressive.** Every claim on a surface should point to a document, a record, or a real sale.
2. **Show the workings.** Price, fees, ownership and history are visible before commitment, never discovered after.
3. **No valuation theatre.** Never show projected returns, growth curves or seller-produced market values.
4. **Both sides are first-class.** Distillery and warehouse tooling gets the same care as the buyer storefront.
5. **The exit is the same venue as the entry.** Resale and bottling are real, designed flows, not afterthoughts.
