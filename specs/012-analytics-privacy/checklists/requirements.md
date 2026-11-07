# Requirements Quality Checklist: Privacy-Safe Analytics (ANL-001)

- [x] **REQ-001**: Feature ID and metadata (`ANL-001`) clearly identified and registered.
- [x] **REQ-002**: Problem statement and privacy proposition (GDPR-safe, zero raw IP) defined.
- [x] **REQ-003**: Actors and permissions identified (Merchant Owner/Admin, Visitor).
- [x] **REQ-004**: User Story 1 (Privacy Fingerprinting) defined with acceptance criteria.
- [x] **REQ-005**: User Story 2 (Bot Separation) defined with acceptance criteria.
- [x] **REQ-006**: User Story 3 (Non-Blocking Telemetry) defined with acceptance criteria.
- [x] **REQ-007**: User Story 4 (Merchant Aggregate Metrics) defined with acceptance criteria.
- [x] **REQ-008**: IPv4 (/24) and IPv6 (/48) subnet truncation logic mathematically specified.
- [x] **REQ-009**: Daily rotating salt (`YYYY-MM-DD:secret`) prevents cross-day tracking.
- [x] **REQ-010**: Bot patterns cover WhatsApp, Facebook, Twitter, Googlebot, Telegram, HeadlessChrome.
- [x] **REQ-011**: Empty or undefined userAgent conservatively classified as bot traffic.
- [x] **REQ-012**: Asynchronous execution via `ctx.waitUntil` or catch-isolated promise verified.
- [x] **REQ-013**: Tenant scoping verified: queries strictly filter by `business_id`.
- [x] **REQ-014**: Input/output schemas conform to strict Zod 4 syntax.
- [x] **REQ-015**: Integration with `src/server/routes/q.$shortCode.ts` and `entry-worker.ts` verified.
- [x] **REQ-016**: Unit test suite planned with 100% pass rate target on Node 24 native test runner.

