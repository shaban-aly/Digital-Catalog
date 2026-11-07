# Architecture & Implementation Plan: Store and Catalog Lifecycle (LIF-001)

## 1. Executive Summary
Feature `LIF-001` provides store and catalog lifecycle management. It enforces operational status separation (`active`, `suspended`, `archived`) and catalog publication flags (`is_published: boolean`), providing deterministic public outcomes, localized Arabic edge pages, and strict tenant permission checks.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Status pages, messages, and UI indicators use authentic Egyptian Arabic and standard RTL markup.
- [x] **Gate 2: Zero Infrastructure Cost**: Edge resolution via Cloudflare Workers and PostgreSQL queries without paid intermediate services.
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 parameters.
- [x] **Gate 4: Multi-Tenant Isolation**: State changes require `business_id` scoping and tenant role checks (`owner` or `admin`).
- [x] **Gate 5: Decoupled Domain Architecture**: Business operational status is completely decoupled from catalog publication.
- [x] **Gate 6: Edge Cache Optimization**: Live stores cache for 5-10m; offline/unpublished/suspended states are strictly `no-cache, no-store`.
- [x] **Gate 7: Safe Fallbacks & Zero Leaks**: Raw database errors, system stack traces, or tenant UUIDs are never returned to public visitors.
- [x] **Gate 8: Deterministic Resolution**: All permutations of business status and catalog status resolve to exactly one deterministic outcome.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage with no unhandled unions or `any` bypasses.
- [x] **Gate 10: Automated Test Coverage**: Comprehensive suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Shared Types & Schemas**:
   - Add `BusinessStatus = 'active' | 'suspended' | 'archived'` in `src/shared/types.ts`.
   - Add `status?: BusinessStatus` to `Business` interface in `src/shared/types.ts`.
   - Update `src/shared/schemas.ts` if needed.
2. **Lifecycle Service (`src/server/services/lifecycle.ts`)**:
   - Implement `LifecycleService` with:
     - `setCatalogPublication(businessId, catalogId, isPublished)`
     - `setBusinessStatus(businessId, status, reason?)`
     - `resolveStoreAvailability(businessSlug)`
     - `renderLifecycleResponse(statusResult, slug)`
3. **Integration with `PublicCatalogService` and `error-pages.ts`**:
   - Verify alignment between `PublicCatalogService.getCatalogByBusinessSlug` and `LifecycleService`.
   - Ensure `error-pages.ts` headers conform to constitutional caching rules (`no-cache, no-store` for offline states).
4. **Automated Unit Testing (`tests/unit/store-lifecycle.test.ts`)**:
   - Test `ToggleCatalogPublishSchema` and `UpdateBusinessStatusSchema`.
   - Test status resolution matrix (active + published = active; active + unpublished = unpublished; suspended + published = suspended; archived = suspended/archived; unknown slug = not_found; reserved slug = reserved).
   - Test edge response generation (`renderLifecycleResponse`) for each status with expected HTTP codes (200/403/404) and headers.
5. **Execution & Verification**:
   - Run `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.

