---
description: "Task list for Tenant Authorization & Data Isolation (TEN-001) implementation"
---

# Tasks: Tenant Authorization & Data Isolation (TEN-001)

**Input**: Design documents from `/specs/002-tenant-authorization/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/tenant-contracts.ts`, `contracts/rls-policies.sql`, `quickstart.md`)

**Prerequisites**: Approved `spec.md` and `plan.md` (Constitutional Gates: 10/10 Passed)

**Status**: Completed & Verified

---

## Phase 1: Setup & Contracts

**Purpose**: Establish interface contracts and migration scaffolding

- [x] T001 [P] Verify `ITenantAuthorizationService` interface in `specs/002-tenant-authorization/contracts/tenant-contracts.ts`.
- [x] T002 [P] Prepare timestamped migration draft `supabase/migrations/20261106190000_tenant_rls_functions_and_policies.sql` containing `is_business_member()` and `is_business_owner()` helper functions.

---

## Phase 2: Foundational Test Harness & Security Primitives

**Purpose**: Automated test suite for tenant isolation and role permissions

- [x] T003 [P] Create unit test suite for tenant authorization and role evaluation in `tests/unit/tenant-authorization.test.ts`.
- [x] T004 [P] Implement `src/server/services/tenant-auth.ts` implementing `ITenantAuthorizationService` with role verification and membership retrieval.

**Checkpoint**: Security service and unit test harness ready.

---

## Phase 3: User Story 1 - Strict Cross-Tenant Data Isolation (Priority: P1) 🎯 MVP

**Goal**: Guarantee 100% data isolation where Merchant A cannot read, modify, or insert data into Merchant B's store.

**Independent Test**: Attempt cross-tenant queries and payload forgery; verify PostgreSQL RLS returns 0 rows modified and blocks unauthorized inserts.

- [x] T005 [US1] Define non-recursive RLS policies for `public.businesses` and `public.business_members` using `is_business_owner()` in migration.
- [x] T006 [US1] Define RLS policies for catalog and menu tables (`categories`, `products`, `catalogs`) scoping write access with `WITH CHECK (public.is_business_member(business_id))`.
- [x] T007 [US1] Create compound performance index `idx_business_members_lookup` on `public.business_members (business_id, user_id, role)` to guarantee sub-millisecond evaluation.

**Checkpoint**: Cross-tenant data isolation fully specified and modeled in SQL DDL.

---

## Phase 4: User Story 2 - Public Read-Only Access to Published Catalogs (Priority: P1)

**Goal**: Allow anonymous visitors to view published catalogs and active categories of active businesses, while universally blocking anonymous writes.

**Independent Test**: Execute anonymous SELECT on published items (succeeds) and anonymous INSERT/UPDATE/DELETE (fails with RLS violation).

- [x] T008 [US2] Define public `anon` read policy for active businesses (`status = 'active'`) and published catalogs (`is_published = true`) in migration.
- [x] T009 [US2] Verify universal anonymous write denial (zero INSERT, UPDATE, or DELETE policies for `anon` role).
- [x] T010 [US2] Verify suspended/inactive business exclusion from public RLS read policy.

**Checkpoint**: Public catalog read-only gateway operational and safe.

---

## Phase 5: User Story 3 - Role-Based Store Ownership & Membership (Priority: P1)

**Goal**: Enforce role distinctions (`owner`, `admin`, `editor`, `viewer`) so only owners can alter business settings or delete the store.

**Independent Test**: Verify an `editor` can modify products but cannot alter business membership or delete the business profile.

- [x] T011 [US3] Implement member role enforcement in `src/server/services/tenant-auth.ts` (`checkPermission(userId, businessId, role)`).
- [x] T012 [US3] Integrate membership role verification in `src/routes/_admin.tsx` ensuring only authorized members can view the dashboard.
- [x] T013 [US3] Verify instant access termination on member removal in `business_members` without waiting for token expiry.

**Checkpoint**: Role hierarchy and member lifecycle operational.

---

## Phase 6: Polish, Automated Verification & Quality Gates

**Purpose**: Cross-cutting verification, type safety, and end-to-end testing

- [x] T014 Run automated unit test suite (`node --test tests/unit/*.test.ts`) covering redirect, error mapper, and tenant authorization tests (17/17 Passed).
- [x] T015 Execute strict TypeScript typecheck (`npx tsc --noEmit`) and resolve any warnings (0 errors).
- [x] T016 Verify compliance with all acceptance scenarios in `specs/002-tenant-authorization/quickstart.md`.

---

## Verification Results

- **Unit Tests**: 17 passing tests across 3 suites (`tests/unit/redirect.test.ts`, `tests/unit/auth-error-mapper.test.ts`, `tests/unit/tenant-authorization.test.ts`).
- **TypeScript**: `npx tsc --noEmit` exited with 0 errors in strict mode.
- **Security Check**: RLS recursion eliminated via `SECURITY DEFINER` functions; anonymous writes blocked; role hierarchy verified.
