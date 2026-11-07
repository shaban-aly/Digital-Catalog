# Requirements Checklist: Background Jobs & Data Retention (JOB-001)

- [x] **REQ-001**: Background jobs run idempotently without corrupting or duplicating aggregate counts.
- [x] **REQ-002**: `compactAnalytics` job aggregates and cleans raw QR scan events older than retention period (default 30 days).
- [x] **REQ-003**: `pruneNotifications` job deletes read notification records older than retention threshold (default 90 days).
- [x] **REQ-004**: `checkSubscriptions` job detects expired Pro accounts and triggers Arabic renewal notifications.
- [x] **REQ-005**: Job execution tracking records `job_name`, `status`, `started_at`, `completed_at`, `records_processed`, and `error_message`.
- [x] **REQ-006**: Supports job statuses: `pending`, `running`, `completed`, `failed`.
- [x] **REQ-007**: Bearer token authorization guard (`CRON_SECRET`) secures scheduled execution endpoints.
- [x] **REQ-008**: Unauthenticated cron requests receive immediate HTTP 401 Unauthorized.
- [x] **REQ-009**: Background processing failure never blocks or affects customer catalog or QR requests.
- [x] **REQ-010**: All generated expiration alerts and logs are formatted in Arabic RTL.
- [x] **REQ-011**: Zero dedicated server or Redis infrastructure ($0 budget compliance).
- [x] **REQ-012**: Bounded query batches (default 100, max 500 records per run) prevent timeout on serverless workers.
- [x] **REQ-013**: Zod 4 schemas validate all job execution inputs, options, and status payloads.
- [x] **REQ-014**: Manual execution API allows Super Admin to trigger individual jobs on demand.
- [x] **REQ-015**: Edge-safe and Node.js-compatible without reliance on persistent daemon background loops.
- [x] **REQ-016**: Unit test suite validates job execution, retention calculations, authorization guards, and error resilience.
