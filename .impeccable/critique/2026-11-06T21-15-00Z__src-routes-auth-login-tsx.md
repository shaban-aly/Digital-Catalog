---
target: src/routes/auth/login.tsx
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 3
target_identity: "file:E:\\Projects\\Digital-Catalog\\src\\routes\\auth\\login.tsx"
target_fingerprint: "sha256:91387cec92d582458baff739f6e8970386331ea916fab70891471ce989673639"
target_path: "E:\\Projects\\Digital-Catalog\\src\\routes\\auth\\login.tsx"
timestamp: 2026-11-06T21-15-00Z
slug: src-routes-auth-login-tsx
---
Method: dual-agent (A: abba7b95 · B: 2cf57339)

Target: src/routes/auth/login.tsx
Surface: Merchant Login Screen — Digital Menu ديجيتال منيو

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No spinner on button; no loading state during initial auth check |
| 2 | Match System / Real World | 2 | Email login ID mismatches WhatsApp-native merchant mental model |
| 3 | User Control and Freedom | 3 | Escape paths exist; forgot-password UX discovery is delayed |
| 4 | Consistency and Standards | 2 | Two bare <button> elements outside the Button component system |
| 5 | Error Prevention | 2 | Raw SDK error strings leak to user (English in Arabic UI) |
| 6 | Recognition Rather Than Recall | 3 | Fields labelled; mode switch (login/reset) is abrupt |
| 7 | Flexibility & Efficiency | n/a | Auth screen |
| 8 | Aesthetic and Minimalist Design | 3 | Clean card; "(Free Forever)" English in RTL string |
| 9 | Error Recovery | 2 | No role=alert; focus not moved on error; no inline field-level error |
| 10 | Help and Documentation | n/a | Auth screen |
| Total | | 20/32 | Acceptable |

## Design Specificity Verdict
Partially Authored — Surface Branding, Generic Bones. 4/10 on specificity.
No WhatsApp signal. No regional trust signals. Placeholder "M" logo in production.
Green used on text links violating DESIGN.md's core "One Voice Rule".
Detector: [] — zero violations. Issues are structural/semantic not token-hygiene.

## Overall Impression
Functional but fails its primary job of building trust before sign-in.

## What's Working
1. Anti-enumeration on password reset — both paths show same success message.
2. Email value preserved when switching to reset mode.
3. autoComplete attributes correctly set (email, current-password).

## Priority Issues

[P0] Raw SDK Error Strings Leaking in English
- err.message passed directly to Arabic UI; Supabase throws English strings like "Invalid login credentials"
- Fix: whitelist and map known error codes to Arabic strings; never pass raw err.message
- Command: /impeccable harden

[P1] Triple Accessibility Failure — Labels, Alerts, Landmark
- Input elements rendered without id prop → htmlFor={undefined} → labels not associated
- Error divs have no role=alert / aria-live → screen readers silent on failure
- No <main> landmark wrapping the form
- Fix: add id props to all Inputs, add role=alert aria-live=assertive to error containers, wrap in <main>
- Command: /impeccable audit

[P1] Four Sub-44px Touch Targets
- "نسيت كلمة المرور؟" ~16-18px; "العودة لتسجيل الدخول" ~20px; "العودة للصفحة الرئيسية" ~16px; register link ~18px
- Violates DESIGN.md absolute rule; most critical on the forgot-password recovery path
- Fix: add min-h-[44px] and inline-flex alignment to all four elements
- Command: /impeccable adapt

[P1] Green on Text Links Dilutes WhatsApp Conversion Signal
- text-emerald-700 hardcoded on "نسيت كلمة المرور؟" (line 145) and register link (line 217)
- Violates DESIGN.md "One Voice Rule" — green reserved for WhatsApp and availability only
- Fix: change to text-[var(--text-secondary)] with underline; add --link-color token
- Command: /impeccable clarify

[P2] No Password Visibility Toggle + Contrast Failures
- No show/hide toggle on password field; type-typos cause silent login failures
- #94A3B8 on white = 2.6:1 (fails WCAG AA 4.5:1)
- #EF4444 on rose-50 = 3.6:1 (fails WCAG AA for text-xs)
- Fix: add Eye/EyeOff toggle; deepen --text-muted to #64748B; use #B91C1C for error text
- Command: /impeccable audit

## Persona Red Flags
Jordan: email-only login, no registration prominence on first view, 16px forgot-password target, raw English error message
Sam: "نسيت كلمة المرور؟" appears in tab order BEFORE the password field; no role=alert; labels unassociated; no aria-hidden on decorative icon
Hassan (Suez cafe owner): English SDK error, placeholder "M" logo suggests unfinished product, no trust signal, no Remember Me, no WhatsApp support link

## Minor Observations
- ArrowLeft in RTL "back" context is semantically reversed (should be ArrowRight)
- bg-white override on Card bypasses var(--bg-surface) token
- h-13 in Button.tsx size="lg" is non-standard Tailwind class
- (Free Forever) English parenthetical in RTL string may render with misplaced parentheses
- resetSuccess correctly cleared when returning to login ✓

## Questions to Consider
1. Why email as the login identifier? Phone+OTP via WhatsApp/SMS would eliminate the entire password reset flow and match the mental model of the target persona.
2. Is there a trust signal — even one line — that could be added? No merchant count, no "مجاناً للأبد · بدون بطاقة ائتمانية."
3. What does the merchant see immediately after login? If the dashboard is also flat, the trust deficit continues past this screen.


بناءً على اختيارك للمعالجة الشاملة لجميع الأولويات (P0 + P1 + P2) وإضافة سطر تعزيز الثقة، إليك تسلسل الأوامر الموصى بها لتنفيذ الإصلاحات:

/impeccable harden src/routes/auth/login.tsx

معالجة P0 (الاستقرار والأمان): وضع قاموس تعريب صارم لرموز أخطاء Supabase/SDK لمنع تسريب أي نصوص إنجليزية للتاجر.
ميزة إظهار/إخفاء كلمة المرور: إضافة زر تبديل الرؤية (Eye/EyeOff) لحقل كلمة المرور للحد من إخفاقات الدخول.

/impeccable audit src/routes/auth/login.tsx

معالجة P1 (إمكانية الوصول والتباين WCAG AA): ربط الـ <label> بالحقول برمجياً عبر id، إضافة role="alert" للافتات الأخطاء، وإضافة الوسم الدلالي <main>.
تصحيح التباين: تعميق درجات النصوص الخافتة ورسائل الخطأ لتلبي معايير القراءة في ضوء الشمس.

/impeccable adapt src/routes/auth/login.tsx

معالجة P1 (أهداف اللمس للجوال): رفع مساحة اللمس لجميع الروابط والأزرار الثانوية ("نسيت كلمة المرور؟"، رابط العودة، رابط إنشاء الحساب) إلى 44px كحد أدنى.

/impeccable clarify src/routes/auth/login.tsx

معالجة P1 (انضباط الهوية البصرية والنصوص): إزالة اللون الأخضر من الروابط لحصر إشارة اللون بـ WhatsApp فقط، استبدال التعبير الإنجليزي (Free Forever)، وتصحيح اتجاه سهم الرجوع في سياق RTL.
تعزيز الثقة: تضمين سطر المصداقية المعتمد تحت العنوان لإشعار التاجر بالأمان فور وصوله.

/impeccable polish src/routes/auth/login.tsx

اللمسات النهائية وإغلاق لقطة النقد والتحقق من سلامة كافة الحالات.