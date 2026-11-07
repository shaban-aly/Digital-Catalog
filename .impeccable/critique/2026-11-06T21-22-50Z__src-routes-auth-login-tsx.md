---
target: src/routes/auth/login.tsx
total_score: 38
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:E:\\Projects\\Digital-Catalog\\src\\routes\\auth\\login.tsx"
target_fingerprint: "sha256:7b5410be2c25f0aae24fed19282c072fabb5d67edfb5cd6e4ee39e340bc35b56"
target_path: "E:\\Projects\\Digital-Catalog\\src\\routes\\auth\\login.tsx"
timestamp: 2026-11-06T21-22-50Z
slug: src-routes-auth-login-tsx
closed: true
---
Method: dual-agent (A: 237ff938 · B: 508f2a77)

Target: src/routes/auth/login.tsx
Surface: Merchant Authentication Gateway — Digital Menu ديجيتال منيو

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4 | Spinners + dynamic Arabic labels prevent double submissions |
| 2 | Match System / Real World | 4 | Natural Arabic vocabulary, clean RTL structure with scoped LTR inputs |
| 3 | User Control and Freedom | 4 | In-card mode toggle, email state preserved, password visibility toggle |
| 4 | Consistency and Standards | 4 | Design tokens strictly observed; emerald uncontained greens removed |
| 5 | Error Prevention | 4 | email.trim(), show/hide toggle, htmlFor/id bindings, redirect sanitization |
| 6 | Recognition Rather Than Recall | 4 | Contextual placeholders, persistent labels, state preserved across modes |
| 7 | Flexibility and Efficiency | 3 | Smooth keyboard nav; no one-tap OAuth or explicit remember-me |
| 8 | Aesthetic and Minimalist Design | 4 | High signal-to-noise ratio; crisp elevated card; clean RTL hierarchy |
| 9 | Error Recovery | 4 | mapSupabaseError Arabic translation; anti-enumeration preserves security |
| 10 | Help and Documentation | 3 | Trust badge and descriptive subheaders; no direct WhatsApp fallback |
| Total | | 38/40 | Excellent (95%) |

## Design Specificity Verdict
Authentic & Grounded (Authored).
The screen directly communicates the core product promise with the trust badge "منصة القوائم الرقمية المجانية للتجار" and "أنشئ متجرك مجاناً للأبد". English SDK errors completely eliminated. Green strictly preserved for WhatsApp and availability states.
Detector: [] — zero violations.

## Overall Impression
High craft, robust ergonomics, and dignified cultural grounding. The screen now excels as a welcoming, trustworthy merchant gateway.

## What's Working
1. Flawless RTL Layout & Touch Ergonomics — all buttons, inputs, and toggles exceed 44px minimum touch target.
2. Empathetic & Resilient Localization — mapSupabaseError and email.trim() eliminate tech friction and foreign jargon.
3. Inclusive Accessibility Foundations — semantic <main>, explicit id/htmlFor, role="alert", aria-live.

## Priority Issues

[P2] Direct Support Fallback for Locked-Out Merchants
- Small merchants in Suez frequently lose email access or hit spam filters; when recovery fails they hit a dead end
- Fix: Add a secondary WhatsApp support link ("تواجه مشكلة في الدخول؟ تواصل معنا عبر واتساب")
- Suggested command: /impeccable clarify

[P3] Visual Alignment of Password Reveal Toggle
- Password field is dir="ltr" with pl-11; text starts next to the eye toggle on the left
- Fix: verify positioning so the toggle feels natural on all viewport sizes
- Suggested command: /impeccable polish

[P3] Header Logo Link Height
- Logo link is ~32px, slightly under 44px
- Fix: add py-1.5 or min-h-[44px]
- Suggested command: /impeccable polish

## Persona Red Flags
Jordan (First-Timer): Zero blocking red flags; clear Arabic reassurance; trust badge establishes credibility.
Casey (Distracted Mobile): Single-handed thumb targets pass 44px everywhere; spinner gives immediate 3G feedback.
Sam (Accessibility): Fully navigable via keyboard and screen reader; labels announced; alerts announced dynamically.

## Minor Observations
- ArrowRight correctly vectors backwards in RTL reading flow.
- Reset mode anti-enumeration guarantees account privacy.
