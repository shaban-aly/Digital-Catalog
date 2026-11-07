# Tasks: Audit Logs & Governance History (AUD-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align audit schemas in `specs/018-audit-logs/contracts/audit-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align audit domain types in `src/shared/types.ts`.

## Phase 2: Core Audit Log Service Implementation
- [x] **TASK-003**: Implement `AuditLogService` in `src/server/services/audit-log.ts`:
  - `canViewAuditLogs(role: string): boolean`
  - `recordEvent(input: RecordAuditInput): Promise<AuditLogRecord>`
  - `listLogs(userId: string, userRole: string, query: ListAuditLogsQueryInput): Promise<{ logs: AuditLogRecord[], total: number, page: number, totalPages: number }>`

## Phase 3: Automated Testing & Verification
- [x] **TASK-004**: Create comprehensive test suite `tests/unit/audit-logs.test.ts` covering:
  - Role-based authorization gate (owner/admin pass, editor/viewer rejected with Arabic 403).
  - Schema validation for audit actions, target types, and RFC 4122 UUIDs.
  - Non-blocking resilient logging.
  - Query pagination and action/target filtering.
  - Strict multi-tenant isolation.
- [x] **TASK-005**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-006**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-007**: Update `docs/specifications/feature-registry.md` marking `AUD-001` as `Implemented & Verified`.
