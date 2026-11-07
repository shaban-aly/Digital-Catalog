---
description: "Task list for Identity and Access (IDN-001) implementation"
---

# Tasks: Identity and Access (IDN-001)

**Input**: Design documents from `/specs/001-identity-access/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/auth-contracts.ts`, `quickstart.md`)

**Prerequisites**: Approved `spec.md` and `plan.md` (Constitutional Gates: 10/10 Passed)

**Status**: Completed & Verified

---

## Phase 1: Setup & Shared Utilities

**Purpose**: Core utilities and validation foundations

- [x] T001 Verify Supabase client initialization in `src/server/db/supabase.ts` ensuring anon-key only and `localStorage` session persistence.
- [x] T002 [P] Implement the Open Redirect sanitizer `sanitizeRedirectUrl` in `src/client/utils/redirect.ts` per `contracts/auth-contracts.ts`.

---

## Phase 2: Foundational Test Harness & Error Infrastructure

**Purpose**: Automated verification tests for error handling and redirect security

- [x] T003 [P] Create unit test suite for Open Redirect sanitizer in `tests/unit/redirect.test.ts` (testing external protocols, protocol-relative paths, backslashes, and valid relative routes).
- [x] T004 [P] Create unit test suite for Arabic error mapper in `tests/unit/auth-error-mapper.test.ts` (testing invalid credentials, duplicate registration, password length, rate limits, and network errors).
- [x] T005 Verify and align `mapSupabaseError` in `src/client/hooks/use-auth.tsx` with the approved Arabic translation matrix in `research.md`.

**Checkpoint**: Foundation and security tests in place — ready for user story implementation.

---

## Phase 3: User Story 1 - Merchant Account Registration (Priority: P1) 🎯 MVP

**Goal**: Allow a new merchant to register securely with email and password with inline Arabic validation and duplicate email protection.

**Independent Test**: Navigate to `/auth/register`, submit valid credentials, and verify account creation and confirmation feedback without exposing system errors.

- [x] T006 [P] [US1] Align registration form validation in `src/routes/auth/register.tsx` with `registerSchema` from `data-model.md` (email format, min 6 characters, password confirmation match).
- [x] T007 [US1] Verify duplicate email error handling in `src/routes/auth/register.tsx` to display friendly Arabic message ("هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.").

**Checkpoint**: User Story 1 is functional and verifiable independently.

---

## Phase 4: User Story 2 - Merchant Sign-In, Session Restoration & Sign-Out (Priority: P1)

**Goal**: Allow returning merchants to log in, maintain persistent sessions across page reloads, and sign out securely.

**Independent Test**: Log in with valid credentials, refresh browser to confirm silent session restoration, and click "Sign Out" to verify session revocation and redirection to `/auth/login`.

- [x] T008 [US2] Verify `signIn`, `signOut`, and silent session recovery (`getSession` + `onAuthStateChange`) in `src/client/hooks/use-auth.tsx`.
- [x] T009 [US2] Update `src/routes/auth/login.tsx` to display the generic Arabic credentials error ("البريد الإلكتروني أو كلمة المرور غير صحيحة.") and prevent credential harvesting.
- [x] T010 [US2] Verify sign-out action in `src/routes/_admin.tsx` revokes auth tokens, clears client state, and navigates to `/auth/login`.

**Checkpoint**: User Stories 1 and 2 work independently with full session lifecycle.

---

## Phase 5: User Story 3 - Protected Route Access & Open Redirect Protection (Priority: P1)

**Goal**: Protect administrative routes from unauthenticated visitors and safely redirect merchants to their bookmarked page after login without Open Redirect vulnerabilities.

**Independent Test**: Visit `/dashboard/products` while logged out, confirm redirect to `/auth/login?redirect=%2Fdashboard%2Fproducts`, log in, and verify browser lands on `/dashboard/products`. Attempt `?redirect=https://evil.com` and verify it defaults to `/dashboard`.

- [x] T011 [US3] Integrate `sanitizeRedirectUrl` in `src/routes/_admin.tsx` when capturing the intercepted location.
- [x] T012 [US3] Integrate `sanitizeRedirectUrl` in `src/routes/auth/login.tsx` to safely compute navigation destination upon successful login.
- [x] T013 [US3] Verify that public catalog routes (`/c/:slug` and `{slug}.digitalmenu.daleel-al-suez.com`) remain completely unauthenticated and edge-cacheable.

**Checkpoint**: Route protection and redirect security fully operational.

---

## Phase 6: User Story 4 - Password Recovery Flow (Priority: P2)

**Goal**: Allow merchants to request password resets without revealing account existence, and reset passwords via callback link.

**Independent Test**: Submit a non-existent email in the forgot password modal on `/auth/login` and verify generic success message is displayed without user enumeration.

- [x] T014 [US4] Implement anti-enumeration generic confirmation message in the forgot password modal in `src/routes/auth/login.tsx` ("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني في حال كان الحساب مسجلاً لدينا.").
- [x] T015 [US4] Verify password recovery callback token exchange and password update form in `src/routes/auth/callback.tsx`.

---

## Phase 7: Polish, Automated Verification & Quality Gates

**Purpose**: Cross-cutting verification, type safety, and end-to-end testing

- [x] T016 Run automated unit test suite with Vitest / Node Test Runner (`node --test tests/unit/*.test.ts`) and ensure 100% pass rate (13/13 Passed).
- [x] T017 Execute strict TypeScript typecheck (`npx tsc --noEmit`) and resolve any type warnings (0 errors).
- [x] T018 Execute manual verification scenarios 1 through 7 defined in `specs/001-identity-access/quickstart.md`.

---

## Verification Results

- **Unit Tests**: 13 passing tests across 2 suites (`tests/unit/redirect.test.ts` and `tests/unit/auth-error-mapper.test.ts`).
- **TypeScript**: `npx tsc --noEmit` exited with 0 errors in strict mode.
- **Security Check**: 100% of Open Redirect attack patterns neutralized. Anti-enumeration active for password reset.
