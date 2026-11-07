# Tasks: Merchant Dashboard Workspace (MCH-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align `DashboardBusinessSummarySchema` and `DashboardMetricCardSchema` in `specs/014-merchant-dashboard/contracts/dashboard-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align dashboard types in `src/shared/types.ts`.

## Phase 2: Route Layout & Overview Components Verification
- [x] **TASK-003**: Verify route guard in `src/routes/_admin.tsx` safely protects routes and prevents open redirects.
- [x] **TASK-004**: Verify subdomain banner in `src/routes/_admin/dashboard/index.tsx` displays canonical URL with 1-click copy.
- [x] **TASK-005**: Verify QR modal integration and download handoff.
- [x] **TASK-006**: Verify metric cards properly display estimate badges (`تقديري`).

## Phase 3: Automated Testing & Verification
- [x] **TASK-007**: Create comprehensive test suite `tests/unit/merchant-dashboard.test.ts` covering:
  - Zod 4 schema validation.
  - Subdomain URL canonical formatting.
  - Open redirect prevention.
  - Estimate badge resolution.
- [x] **TASK-008**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-009**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-010**: Update `docs/specifications/feature-registry.md` marking `MCH-001` as `Implemented & Verified`.
