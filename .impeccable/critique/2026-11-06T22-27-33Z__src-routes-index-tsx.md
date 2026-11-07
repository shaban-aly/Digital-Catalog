---
target: src/routes/index.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 4
target_identity: "file:E:\\Projects\\Digital-Catalog\\src\\routes\\index.tsx"
target_fingerprint: "sha256:074c3671add6142e56c0a38f8a7ab5deb35eb665242b6fa2259368a640ac72b8"
target_path: "E:\\Projects\\Digital-Catalog\\src\\routes\\index.tsx"
timestamp: 2026-11-06T22-27-33Z
slug: src-routes-index-tsx
---
Method: dual-agent (A: 40b0c623 · B: f9d64b8b)

Target: src/routes/index.tsx
Surface: Landing Page & Merchant Acquisition — Digital Menu ديجيتال منيو
Surface Mode: Persuade

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | Static page; no live interactive preview or catalog demo feedback |
| 2 | Match System / Real World | 2 | Good title, but technical jargon leaks: "Edge CDN", "Cloudflare Workers", "React 19" |
| 3 | User Control and Freedom | 3 | Standard navigation, but no way to test-drive or preview menu without signup |
| 4 | Consistency and Standards | 1 | Undefined tokens (--brand-primary/--brand-accent); violates green One-Voice rule |
| 5 | Error Prevention | 3 | Static page; no high-risk inputs |
| 6 | Recognition Rather Than Recall | 2 | No visual menu mockup or table QR preview; user must imagine the product |
| 7 | Flexibility and Efficiency | 2 | Single linear CTA flow; no sample QR to scan with phone directly |
| 8 | Aesthetic and Minimalist Design | 2 | Generic boilerplate (hero + 3 cards); missing tokens cause broken contrast |
| 9 | Error Recovery | 3 | Static marketing surface |
| 10 | Help and Documentation | 1 | No "How It Works" 3-step explainer; no FAQ answering merchant fears |
| Total | | 21/40 | Acceptable (52.5%) — Needs Deep Polish & Hardening |

## Priority Backlog
- [P0] Undefined CSS Tokens: `--brand-primary` and `--brand-accent` missing from globals.css.
- [P0] Sub-44px Touch Targets: Navbar buttons use size="sm" (32px), failing mobile touch criteria.
- [P1] One-Voice Rule Violation: Emerald green scattered on promo badge, feature checks, and button shadows.
- [P1] Missing `<main>` Landmark: Hero and features unwrapped by semantic landmark.
- [P1] Off-Ramp Font Size: `text-[10px]` flagged by detector.
- [P1] RTL Arrow Direction: Hardcoded ArrowLeft without directional rotation or aria-hidden.
- [P2] Alienating Tech Jargon: "Edge CDN" and "Cloudflare Workers و React 19" instead of merchant value.
- [P2] Missing Product Visuals & Mockup: No realistic mobile menu or printed table QR preview.
- [P2] Missing Bottom CTA Section: Page abruptly drops into footer.
