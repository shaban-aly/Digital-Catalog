# Architecture & Implementation Plan: Platform Super Admin Dashboard (ADM-001)

## 1. Executive Summary
Feature `ADM-001` delivers a privileged Super Admin management module (`/platform-admin`) that allows platform owners to govern multi-tenant stores, track platform-wide KPIs, manually upgrade merchant subscriptions upon receipt of local offline payments (InstaPay / Vodafone Cash), suspend abusive or unpaid storefronts, and protect system reserved subdomains.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Super Admin interface, Arabic operational status badges (نشط، موقوف، مؤرشف), and system error prompts are natively Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: Bounded Supabase SQL aggregation and direct updates with zero recurring external payment provider overhead ($0/mo).
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax and RFC 4122-compliant UUID rules.
- [x] **Gate 4: Strict Super Admin Isolation**: Only authorized super admins can query platform KPIs or execute cross-tenant status/plan modifications; regular merchants receive immediate 403 Forbidden.
- [x] **Gate 5: Offline Egyptian Payment Workflow**: Tailored for Egyptian small merchants who pay via InstaPay / Vodafone Cash; allows recording transfer reference numbers and manual tier activation.
- [x] **Gate 6: Reserved Subdomain Governance**: Guarantees system subdomains (`admin`, `api`, `billing`, `support`, `digitalmenu`) remain strictly reserved and cannot be acquired or assigned to merchants.
- [x] **Gate 7: Operational Status Cascade**: Suspending a store via `updateBusinessStatus` immediately updates business status to `suspended`, causing public catalog requests to render 403 Forbidden with Arabic notice.
- [x] **Gate 8: Scalable Pagination & Filtering**: Directory queries support page-based pagination (default 20, max 100) and case-insensitive searching on name and slug.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `PlatformKpis`, `BusinessAdminListItem`, and admin mutation inputs.
- [x] **Gate 10: Automated Test Coverage**: Comprehensive test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - Verify `PlatformKpisSchema`, `ListBusinessesAdminQuerySchema`, and `UpdateSubscriptionAdminSchema` in `src/shared/schemas.ts`.
   - Add admin types to `src/shared/types.ts`.
2. **Platform Admin Service (`src/server/services/platform-admin.ts`)**:
   - `isSuperAdmin(userId: string)`: verify whether caller is registered in super admin whitelist/table.
   - `assertSuperAdmin(userId: string)`: enforce privilege barrier or throw 403 Forbidden.
   - `getPlatformKpis(userId: string)`: aggregate platform-wide counts (total merchants, active stores, suspended stores, total products, total QR scans).
   - `listBusinesses(userId: string, query: ListBusinessesAdminQueryInput)`: paginated directory with optional name/slug search and status filter.
   - `updateBusinessStatus(userId: string, input: UpdateBusinessStatusInput)`: administrative status toggle (active, suspended, archived).
   - `updateBusinessSubscription(userId: string, input: UpdateSubscriptionAdminInputType)`: manual tier and quota update.
   - `getReservedSlugs(userId: string)`: return list of protected platform namespaces.
3. **Automated Unit Testing (`tests/unit/platform-admin.test.ts`)**:
   - Test Super Admin authorization gate and 403 denial for non-admin users.
   - Test KPI aggregation schema validation and arithmetic.
   - Test business directory query validation (search, status, pagination limits).
   - Test manual subscription upgrade schema validation (plan code, product limit, category limit, notes).
   - Test operational status updates and reserved slugs listing.
4. **Execution & Verification**:
   - Run `node --test tests/unit/platform-admin.test.ts`.
   - Run all test suites `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.
