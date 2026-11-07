# Implementation Plan: Identity and Access (IDN-001)

**Branch**: `004-identity-access` | **Feature ID**: `IDN-001` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-identity-access/spec.md`

---

## Summary

Establish secure, robust merchant identity and authentication for the platform (`IDN-001`), supporting email/password registration, login, silent session restoration, safe sign-out, Open Redirect-protected post-login redirection, and anti-enumeration password reset requests. Connects client-side TanStack Start application to Supabase Auth over HTTPS/stateless JWT, mapped to Arabic user-facing errors, while strictly delegating tenant data isolation to `TEN-001`.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ (LTS) / React 19

**Primary Dependencies**:
- Full-stack Framework: `@tanstack/react-start` (Vite-powered edge SSR)
- Routing & Data: `@tanstack/react-router`, `@tanstack/react-query`
- Backend Client: `@supabase/supabase-js` (PostgREST over HTTPS)
- Validation: `zod`
- Icons & Styling: `lucide-react`, `tailwindcss`

**Storage**:
- Identity Provider: Supabase Auth (`auth.users` managed schema)
- Client Storage: Browser `localStorage` (native Supabase session persistence)
- Database Schemas: Zero custom tables or migrations in `public` schema for `IDN-001`

**Testing**:
- Unit & Sanitizer Tests: Vitest
- Type Checking: `tsc --noEmit`

**Target Platform**: Cloudflare Workers (SSR pass-through) + Modern Web Browsers (Mobile/Desktop Chrome, Safari, Edge)

**Project Type**: Full-Stack Web Application with Edge SSR

**Performance Goals**:
- Session restoration: < 100ms from local storage on cold start
- Authentication state resolution: Zero layout shift via elegant loading skeletons
- Redirect sanitization: < 1ms execution time (regex/string checks)

**Constraints**:
- Strict $0 monthly infrastructure cost (Supabase Auth includes 50k MAU on Free Tier)
- 100% Arabic error translation for all provider responses
- Strict Open Redirect neutralization (safe relative fallback)
- Service Role Key strictly excluded from client-side bundles

**Scale/Scope**:
- Target capacity: 50 to 1,000 active merchants in launch phase

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
|---|---|---|
| **I. Spec-Driven & Plan-First** | Work is strictly bounded to `specs/004-identity-access/spec.md` with verified acceptance criteria and quality checklist. | **PASS** |
| **II. Free-First & Zero-Cost Guardrails** | Leverages Supabase Auth free tier (50k MAU) with client-side token storage. Zero server worker cost incurred for public visitors. | **PASS** |
| **III. Single Source of Truth for Security** | `IDN-001` establishes identity (`auth.uid()`). Tenant authorization is strictly decoupled and delegated to `TEN-001` via PostgreSQL RLS. No service role key exposed. | **PASS** |
| **IV. Mobile-First & Edge Public Experience** | Public catalog remains 100% unauthenticated and edge-cacheable. Auth checks only execute on protected admin routes. | **PASS** |
| **V. Decoupled Catalog Domain** | No catalog or product tables are touched or modified by identity access. | **PASS** |
| **VI. Non-Blocking Dynamics & Privacy** | Password reset employs strict anti-enumeration. No sensitive credentials logged or exposed. | **PASS** |
| **VII. Impeccable Design & Arabic-First** | All forms, validation errors, and auth alerts strictly use Arabic RTL typography and components. | **PASS** |
| **VIII. Database Architecture & Governance** | Identity is handled by provider's `auth.users`. Zero unapproved DDL migrations created. | **PASS** |
| **IX. Agent Governance & Scoping** | Execution strictly within scoped files; human approval required prior to any schema or package changes. | **PASS** |
| **X. Modular Feature Decomposition** | Feature strictly adheres to `IDN-001` boundary without creeping into `TEN-001` (Tenant Authorization) or `BIZ-001` (Store Setup). | **PASS** |

*Post-Design Gate Result*: **ALL 10 CONSTITUTIONAL GATES PASSED (10/10)**.

---

## Project Structure

### Documentation (`specs/004-identity-access/`)

```text
specs/004-identity-access/
├── spec.md              # Feature specification (Approved)
├── plan.md              # Implementation plan (This file)
├── research.md          # Technical research and decision records
├── data-model.md        # Entities, Zod schemas, and session state machine
├── quickstart.md        # Runnable verification scenarios
├── contracts/
│   └── auth-contracts.ts # TypeScript interfaces, service contracts, and error mappings
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Mapping (`src/`)

```text
src/
├── client/
│   ├── hooks/
│   │   └── use-auth.tsx       # AuthProvider, useAuth hook, Arabic error mapping
│   ├── utils/
│   │   └── redirect.ts        # Open Redirect sanitizer (sanitizeRedirectUrl)
├── routes/
│   ├── _admin.tsx             # Protected admin route guard & session check
│   └── auth/
│       ├── login.tsx          # Merchant login view & forgot password modal
│       ├── register.tsx       # Merchant registration view with Zod validation
│       └── callback.tsx       # OAuth / Email confirmation callback handler
└── server/
    └── db/
        └── supabase.ts        # Supabase client initialization (anon key only)
```

---

## Core Technical Components & Design

### Component 1: Open Redirect Sanitizer (`src/client/utils/redirect.ts`)
A lightweight, zero-dependency utility ensuring unvalidated user input in `?redirect=` cannot hijack navigation to an external origin:

```typescript
export function sanitizeRedirectUrl(rawRedirect: string | null | undefined, fallback = '/dashboard'): string {
  if (!rawRedirect || typeof rawRedirect !== 'string') return fallback;
  const trimmed = rawRedirect.trim();
  // Must start with single '/', reject protocol-relative '//', backslashes, or colons
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\') || trimmed.includes(':')) {
    return fallback;
  }
  return trimmed;
}
```

### Component 2: Auth Context & Error Translation (`src/client/hooks/use-auth.tsx`)
Provides unified access to authentication state, session listener (`onAuthStateChange`), and friendly Arabic error mapping for all Supabase error codes.

### Component 3: Administrative Route Guard (`src/routes/_admin.tsx`)
Intercepts all requests under `/_admin` (and `/dashboard`), safely routing unauthenticated users to `/auth/login?redirect=<safe_path>` while displaying an Arabic loading skeleton during initial session restoration.

---

## Complexity Tracking

> **No constitutional violations detected. Table kept empty.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | *N/A* | *N/A* |

---

## Phase 0 & Phase 1 Deliverables Summary

1. **Research Artifact**: [`research.md`](./research.md) — Solved session restoration in edge SSR, Open Redirect prevention formulas, and anti-enumeration mapping.
2. **Data Model Artifact**: [`data-model.md`](./data-model.md) — Specified `MerchantIdentity`, `AuthSession`, and Zod validation schemas.
3. **Contracts Artifact**: [`contracts/auth-contracts.ts`](./contracts/auth-contracts.ts) — Defined `IAuthService`, `IRedirectProtector`, and TypeScript state interfaces.
4. **Validation Guide**: [`quickstart.md`](./quickstart.md) — Outlined 7 runnable scenarios to verify all user stories independently.
