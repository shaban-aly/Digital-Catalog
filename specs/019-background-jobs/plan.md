# Architecture & Implementation Plan: Background Jobs & Data Retention (JOB-001)

## 1. Executive Summary
Feature `JOB-001` provides a lightweight, resilient, and idempotent background maintenance processor. Designed specifically for our Free-First ($0 budget) architecture, it safeguards Supabase free-tier database capacity (500MB) by compacting stale telemetry, pruning old notifications, and verifying subscription expirations without dedicated worker infrastructure.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Generated system alerts and notification bodies are natively in Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: Stateless execution via serverless cron / GitHub Actions without 24/7 worker VMs or Redis ($0/mo).
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax.
- [x] **Gate 4: Idempotent Execution**: Maintenance jobs can be executed repeatedly on the same day without duplicating rollups or corrupting records.
- [x] **Gate 5: Free-Tier Database Capacity Defense**: Analytics compaction prunes raw scans older than 30 days while preserving daily rollups, ensuring table size remains $<50$MB.
- [x] **Gate 6: Secret-Authorized Endpoint Protection**: Webhook / cron entry points require `Authorization: Bearer <CRON_SECRET>`.
- [x] **Gate 7: Customer Isolation & Non-Blocking**: Background execution failure never impacts customer catalog requests or merchant dashboard routes.
- [x] **Gate 8: Bounded Execution Batching**: Jobs process records in bounded chunks (max 500 rows per run) to stay well within serverless invocation timeout limits.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `RunJobInput`, `JobResult`, and execution records.
- [x] **Gate 10: Automated Test Coverage**: Comprehensive test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - Add background job schemas to `src/shared/schemas.ts`:
     - `BackgroundJobNameSchema`, `JobExecutionStatusSchema`, `RunJobSchema`, `JobResultSchema`.
   - Add job domain types to `src/shared/types.ts`.
2. **Background Jobs Service (`src/server/services/background-jobs.ts`)**:
   - `verifyCronSecret(authHeader?: string): boolean`
   - `compactAnalytics(options?: { retentionDays?: number }): Promise<JobResult>`
   - `pruneReadNotifications(options?: { retentionDays?: number }): Promise<JobResult>`
   - `checkSubscriptionExpirations(): Promise<JobResult>`
   - `runMaintenanceBatch(): Promise<JobResult[]>`
3. **Automated Unit Testing (`tests/unit/background-jobs.test.ts`)**:
   - Authorization guard tests (valid bearer token vs missing/invalid token).
   - Schema validation tests (job names, positive retention days, non-negative processed count).
   - `compactAnalytics` retention boundary calculation.
   - `pruneReadNotifications` timestamp threshold logic.
   - `checkSubscriptionExpirations` expiration detection and notification dispatch.
   - Batch runner error resilience and duration calculation.
4. **Execution & Verification**:
   - Run `node --test tests/unit/background-jobs.test.ts`.
   - Run all test suites `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.
