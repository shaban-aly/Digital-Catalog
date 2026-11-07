# Architecture & Implementation Plan: Privacy-Safe Analytics (ANL-001)

## 1. Executive Summary
Feature `ANL-001` implements privacy-safe, non-blocking telemetry for merchant storefronts. It enforces IPv4 /24 and IPv6 /48 subnet truncation, daily rotating salts via SHA-256 HMAC, bot classification separation, and tenant-scoped metric aggregation.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Dashboard metric cards and analytics labels use Arabic terminology.
- [x] **Gate 2: Zero Infrastructure Cost**: Web Crypto API `crypto.subtle.digest` runs directly at Cloudflare Worker edge with zero external trackers.
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax.
- [x] **Gate 4: Multi-Tenant Isolation**: Telemetry and aggregate metrics strictly scoped by `business_id`.
- [x] **Gate 5: Zero Raw IP Storage**: Raw IP truncated to subnet before hashing; never persisted in database.
- [x] **Gate 6: Cross-Day Linkability Prevention**: Rotating daily salt makes cross-day tracking mathematically impossible.
- [x] **Gate 7: Crawler Separation**: Automated bots (WhatsApp preview, Googlebot, etc.) separated from human scans.
- [x] **Gate 8: Non-Blocking Execution**: Asynchronous dispatch ensures zero latency added to customer 302 redirects.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `AnalyticsSummary` and event parameters.
- [x] **Gate 10: Automated Test Coverage**: Complete test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - `LogQrScanEventSchema`, `AnalyticsSummarySchema`, `GetBusinessMetricsQuerySchema` in `src/shared/schemas.ts`.
2. **Service Verification**:
   - Verify `isCrawlerOrBot` handles crawler signatures and empty strings in `src/server/services/analytics.ts`.
   - Verify `generatePrivacyFingerprint` truncates IPv4/IPv6 and returns 64-char hex string in `src/server/services/analytics.ts`.
   - Verify `AnalyticsService.getBusinessMetrics` calculates `totalScans`, `totalViews`, `totalWhatsAppClicks`, and `uniqueVisitorsEstimate` in `src/server/services/analytics-summary.ts`.
3. **Automated Unit Testing (`tests/unit/analytics-privacy.test.ts`)**:
   - Test `isCrawlerOrBot` for WhatsApp, Googlebot, Facebook, Twitter, and legitimate mobile browsers (Safari, Chrome).
   - Test `generatePrivacyFingerprint` IPv4 and IPv6 truncation and rotating salt divergence.
   - Test Zod 4 schema validation.
   - Test `AnalyticsSummary` estimation ratios.
4. **Execution & Verification**:
   - Run `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.

