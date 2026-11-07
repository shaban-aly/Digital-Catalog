---
target: src/routes/auth/register.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:E:\\Projects\\Digital-Catalog\\src\\routes\\auth\\register.tsx"
target_fingerprint: "sha256:675c697bc142281851b0c0d4d5813c064ce8478bce5fbe8c92f79878e07f6cb7"
target_path: "E:\\Projects\\Digital-Catalog\\src\\routes\\auth\\register.tsx"
timestamp: 2026-11-06T21-44-44Z
slug: src-routes-auth-register-tsx
---
Method: dual-agent (A: f8e3be73 · B: 43877055)

Target: src/routes/auth/register.tsx
Surface: Merchant Sign-Up & Store Onboarding Flow — Digital Menu ديجيتال منيو

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 3 | Real-time slug availability check is good; submit button lacks spinner |
| 2 | Match System / Real World | 2 | Good industry labels, but technical jargon (Subdomain) and (Free Forever) |
| 3 | User Control and Freedom | 2 | Confirmation screen has no resend link, no edit email, no back navigation |
| 4 | Consistency and Standards | 2 | 100% of inputs lack id/htmlFor; raw select element; emerald-700 on text link |
| 5 | Error Prevention | 2 | Arabic names yield empty slugs; no password toggle or confirmation |
| 6 | Recognition Rather Than Recall | 2 | Masked password without toggle; hidden dropdown options |
| 7 | Flexibility and Efficiency | 2 | Broken Arabic slug automation; missing inputMode=tel |
| 8 | Aesthetic and Minimalist Design | 3 | 6 fields crammed without chunking or progressive disclosure |
| 9 | Error Recovery | 2 | Raw English SDK errors leak to user; alerts lack role=alert |
| 10 | Help and Documentation | 1 | No contextual tooltips; no WhatsApp helpline for onboarding |
| Total | | 21/40 | Acceptable (52.5%) |

## Design Specificity Verdict
Partially Tailored, but heavily constrained by Western SaaS boilerplate.
Egyptian merchant examples and zero-cost commitment are authentic, but Subdomain jargon, Latin-only auto-slug failure on Arabic store names, raw English error leakage, and sub-44px touch targets create high cognitive and technical friction.
Detector: [] — zero automated AST violations (defects are semantic and ergonomic).

## Overall Impression
Plumbing works, but un-chunked inputs, Arabic slug failure, and accessibility gaps create significant friction for first-time merchants.

## What's Working
1. Unambiguous zero-cost promise ("ابدأ مجاناً 100% بدون أي رسوم خفية").
2. Debounced real-time slug availability check with visual feedback.
3. Practical operational industry descriptors.

## Priority Issues

[P0] Arabic Store Names Fail to Generate Auto-Slugs
- normalizeSlug strips non-ASCII, leaving Arabic names as empty slugs
- Fix: add phonetic transliteration/fallback ID generator with clear Arabic guidance
- Suggested command: /impeccable harden

[P0] Raw English Supabase Error Leaks
- catch block uses err.message directly, exposing technical English errors
- Fix: integrate mapSupabaseError utility
- Suggested command: /impeccable harden

[P1] Broken Label-Input Association & Accessibility
- 100% of Input and select controls lack id and htmlFor bindings; missing <main>; error box lacks role=alert
- Fix: wire id/htmlFor, add role=alert aria-live=assertive, wrap with <main>
- Suggested command: /impeccable audit

[P1] Sub-44px Touch Targets
- Login link, back to home link, and logo link all under 44px
- Fix: enforce min-h-[44px]
- Suggested command: /impeccable adapt

[P2] Missing Password Visibility Toggle & Keypad Adaptation
- No show/hide password toggle; WhatsApp input lacks inputMode=tel
- Fix: add Eye/EyeOff toggle and inputMode=tel
- Suggested command: /impeccable harden

[P2] Technical Jargon & Color Token Discipline
- "Subdomain" and "(Free Forever)" in copy; text-emerald-700 on login link
- Fix: plain Arabic labels ("رابط متجرك"), remove English parenthetical, use semantic link colors
- Suggested command: /impeccable clarify

## Persona Red Flags
Jordan (First-Timer): Intimidated by "Subdomain", types Arabic name and sees slug blank, abandons.
Casey (Mobile 3G): QWERTY opens on phone input, mistypes blind password without toggle.
Sam (Accessibility): No label announcements on any input; error banner unannounced.
Hassan (Suez Merchant): Fears hidden costs due to English jargon; lacks WhatsApp support lifeline.

## Minor Observations
- ArrowLeft used for RTL back navigation instead of ArrowRight.
- Card uses hardcoded bg-white shadow-md instead of var(--bg-surface).
- Hardcoded domain string in preview.
