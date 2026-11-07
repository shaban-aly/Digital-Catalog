# Feature Specification: Privacy-Safe Analytics (ANL-001)

**Feature ID**: `ANL-001`  
**Status**: Ready for Implementation  
**Release**: MVP  
**Source Integration**: QR-001, TEN-001, MCH-001

---

## 1. Purpose and Business Value

Provide merchants with clear, actionable customer engagement signals (scans, unique daily visitors, view estimates) without violating diner privacy or violating GDPR. The platform guarantees zero raw IP persistence, daily rotating salts that make cross-day user tracking mathematically impossible, and 100% non-blocking asynchronous telemetry that never delays customer redirection.

---

## 2. Actors and Permissions

- **Merchant Owner / Admin (`TEN-001`)**: Can read aggregate engagement metrics (`AnalyticsSummary`) for their business in the merchant dashboard.
- **Public Customer / Visitor**: Scans a QR code without authentication; their network identity is truncated and hashed at the edge before any database write.

---

## 3. User Stories

### User Story 1: Privacy-Preserving Daily Salted Fingerprinting (P0 - Priority: Highest)
**As a** customer visiting a digital menu,  
**I want to** know my personal identity and exact IP address are never logged in any platform database,  
**So that** my dining habits remain completely private and compliant with international privacy standards.

- **Acceptance Criteria**:
  - Raw IP address is truncated to `/24` subnet for IPv4 (`x.x.x.0`) and `/48` subnet for IPv6 (`x:x:x::`).
  - Hashed using SHA-256 with rotating daily salt: `SHA-256(YYYY-MM-DD:secret:truncatedIp:userAgent)`.
  - Same customer scanning on Tuesday and Wednesday produces two completely unrelated hashes, making cross-day profiling impossible.
  - Zero raw IP columns exist in `qr_scan_events`.

### User Story 2: Bot & Preview Crawler Separation (P0 - Priority: Highest)
**As a** merchant reviewing my marketing campaign,  
**I want to** distinguish genuine human customer scans from automated WhatsApp link preview bots,  
**So that** my scan metrics represent real diners visiting my store.

- **Acceptance Criteria**:
  - Inspects `User-Agent` against known crawlers: WhatsApp, Facebook External Hit, Twitterbot, Googlebot, TelegramBot, Slackbot, LinkedInBot, HeadlessChrome.
  - Missing or empty User-Agent is conservatively classified as bot (`is_bot: true`).
  - Bot scans are recorded with `is_bot: true` and excluded from `total_scans` increment.

### User Story 3: Non-Blocking Asynchronous Telemetry (P0 - Priority: Highest)
**As a** diner scanning a QR code at a table,  
**I want to** be redirected to the menu in <50ms without waiting for analytics databases,  
**So that** scanning feels instantaneous.

- **Acceptance Criteria**:
  - Telemetry is dispatched via `ctx.waitUntil` or fire-and-forget promise.
  - Database latency or logging errors never delay, degrade, or throw errors during HTTP 302 redirection.

### User Story 4: Merchant Aggregate Engagement Metrics (P1 - Priority: High)
**As a** merchant,  
**I want to** see an accurate summary of my store's activity in my admin dashboard,  
**So that** I can track customer engagement.

- **Acceptance Criteria**:
  - `AnalyticsService.getBusinessMetrics` returns typed `AnalyticsSummary`: `totalScans`, `totalViews`, `totalWhatsAppClicks`, and `uniqueVisitorsEstimate`.
  - Scans are strictly tenant-isolated to the requesting business.

---

## 4. Functional Requirements

- **FR-001**: `generatePrivacyFingerprint(ipAddress, userAgent, secretKey)` produces deterministic daily SHA-256 hash.
- **FR-002**: `isCrawlerOrBot(userAgent)` detects search and social preview bots.
- **FR-003**: `logQrScanEvent` logs scan asynchronously and increments `total_scans` only for human visits.
- **FR-004**: `AnalyticsService.getBusinessMetrics(businessId)` calculates aggregate metrics with tenant isolation.
- **FR-005**: All schemas conform to strict Zod 4 syntax (`LogQrScanEventSchema`, `AnalyticsSummarySchema`).

---

## 5. Non-Functional & Constitutional Guardrails

- **Principle I (Arabic RTL First)**: Dashboard metrics and badges use Arabic terminology.
- **Principle II ($0 Infrastructure)**: In-worker hashing via Web Crypto API `crypto.subtle.digest`; zero external analytics trackers (no Google Analytics, no Meta Pixel).
- **Principle IV (Multi-Tenant Isolation)**: Analytics aggregated strictly by `business_id` through `qr_codes`.
- **Principle VII (Strict Type Safety)**: Complete typing with Zod 4 schemas and TypeScript interfaces.
