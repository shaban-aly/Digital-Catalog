# Architecture & Implementation Plan: Merchant Dashboard Workspace (MCH-001)

## 1. Executive Summary
Feature `MCH-001` provides the authenticated administrative workspace for merchants in Suez. It orchestrates store settings, product/category management, permanent printable QR code generation, canonical subdomain link copying, and engagement metric displays with explicit estimate labeling.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Navigation, cards, modals, and actions are rendered in Egyptian Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: Built directly using TanStack Router, Tailwind CSS, and Supabase client-side hydration.
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax.
- [x] **Gate 4: Multi-Tenant Isolation**: Merchant state strictly bound to `user.id` and resolved `business.id`.
- [x] **Gate 5: Route Protection & Redirect Hygiene**: Open redirect protection via `sanitizeRedirectUrl`.
- [x] **Gate 6: Honest Metric Transparency**: Derived page views and WhatsApp clicks are explicitly labeled as estimated (`تقديري`).
- [x] **Gate 7: Recoverable Onboarding State**: Users without a store receive a helpful setup invitation.
- [x] **Gate 8: Canonical Link Compliance**: Subdomain links conform strictly to `https://{slug}.digitalmenu.daleel-al-suez.com/`.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for dashboard summaries and metric cards.
- [x] **Gate 10: Automated Test Coverage**: Complete test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - `DashboardBusinessSummarySchema` and `DashboardMetricCardSchema` in `src/shared/schemas.ts`.
2. **Dashboard Routes Verification**:
   - Verify `src/routes/_admin.tsx` route protection guard and redirect sanitization.
   - Verify `src/routes/_admin/dashboard/index.tsx` overview cards, QR modal handoff, and subdomain banner.
   - Verify `src/routes/_admin/dashboard/products.tsx` product and category management.
3. **Automated Unit Testing (`tests/unit/merchant-dashboard.test.ts`)**:
   - Test `DashboardBusinessSummarySchema` and `DashboardMetricCardSchema` validation.
   - Test subdomain URL construction and canonical formatting.
   - Test redirect safety guard logic.
   - Test metric card estimate flag resolution.
4. **Execution & Verification**:
   - Run `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.

