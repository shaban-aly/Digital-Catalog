# Tasks: Platform Super Admin Dashboard (ADM-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align `PlatformKpisSchema`, `ListBusinessesAdminQuerySchema`, and `UpdateSubscriptionAdminSchema` in `src/shared/schemas.ts`.
- [x] **TASK-002**: Align admin domain types in `src/shared/types.ts`.

## Phase 2: Core Platform Admin Service Implementation
- [x] **TASK-003**: Implement `PlatformAdminService` in `src/server/services/platform-admin.ts`:
  - `isSuperAdmin(userId: string): Promise<boolean>`
  - `assertSuperAdmin(userId: string): Promise<void>`
  - `getPlatformKpis(userId: string): Promise<PlatformKpisType>`
  - `listBusinesses(userId: string, query: ListBusinessesAdminQueryInput): Promise<{ businesses: BusinessAdminListItem[], total: number, page: number, totalPages: number }>`
  - `updateBusinessStatus(userId: string, input: UpdateBusinessStatusInput): Promise<{ id: string, status: BusinessStatus }>`
  - `updateBusinessSubscription(userId: string, input: UpdateSubscriptionAdminInputType): Promise<{ id: string, planCode: string, maxProducts: number, maxCategories: number }>`
  - `getReservedSlugs(userId: string): Promise<string[]>`

## Phase 3: Automated Testing & Verification
- [x] **TASK-004**: Create comprehensive test suite `tests/unit/platform-admin.test.ts` covering:
  - Super Admin authorization and access denial for non-admins.
  - Platform KPI metrics schema validation and zero/positive bounds.
  - Directory query pagination, filtering, and page boundary checks.
  - Subscription upgrade schema validation (plan tiers, max limits, Egyptian offline transfer notes).
  - Status updates and status transition safety.
  - Reserved subdomains listing and protection.
- [x] **TASK-005**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-006**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-007**: Update `docs/specifications/feature-registry.md` marking `ADM-001` as `Implemented & Verified`.
