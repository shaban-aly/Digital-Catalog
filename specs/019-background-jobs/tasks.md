# Tasks: Background Jobs & Data Retention (JOB-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align job schemas in `specs/019-background-jobs/contracts/job-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align job domain types in `src/shared/types.ts`.

## Phase 2: Core Background Jobs Service Implementation
- [x] **TASK-003**: Implement `BackgroundJobsService` in `src/server/services/background-jobs.ts`:
  - `verifyCronSecret(authHeader?: string): boolean`
  - `assertCronAuthorized(authHeader?: string): void`
  - `compactAnalytics(options?: { retentionDays?: number }): Promise<JobResult>`
  - `pruneReadNotifications(options?: { retentionDays?: number }): Promise<JobResult>`
  - `checkSubscriptionExpirations(): Promise<JobResult>`
  - `runMaintenanceBatch(): Promise<JobResult[]>`

## Phase 3: Automated Testing & Verification
- [x] **TASK-004**: Create comprehensive test suite `tests/unit/background-jobs.test.ts` covering:
  - Bearer token authorization checks (`CRON_SECRET`).
  - Schema validation for job names, positive retention thresholds, and execution results.
  - Retention date math (30-day analytics threshold, 90-day notification pruning).
  - Subscription expiration audit logic and alert triggering.
  - Batch runner error resilience and duration metrics.
- [x] **TASK-005**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-006**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-007**: Update `docs/specifications/feature-registry.md` marking `JOB-001` as `Implemented & Verified`.
