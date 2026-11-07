# Implementation Plan: Business & Store Management (BIZ-001)

**Branch**: `003-business-store-management` | **Feature ID**: `BIZ-001` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-business-store-management/spec.md`

---

## Summary

Enable a merchant to establish and manage their store's commercial identity—the central tenant entity that owns all product catalogs, categories, images, and QR codes. Ensures each business receives a unique, DNS-compliant platform subdomain (`{store-slug}.digitalmenu.daleel-al-suez.com`), automatically provisions a default operational branch ("الفرع الرئيسي"), and records essential store contact details and currency settings.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / PostgreSQL 15+ / React 19

**Primary Dependencies**:
- Full-stack Framework: `@tanstack/react-start` (Vite-powered edge SSR)
- Routing & Data: `@tanstack/react-router`, `@tanstack/react-query`
- Database Client: `@supabase/supabase-js` (PostgREST over HTTPS)
- Validation: `zod`
- Icons & UI: `lucide-react`, `tailwindcss`

**Storage**:
- PostgreSQL Tables: `public.businesses`, `public.branches`, `public.business_members`, `public.catalogs`
- Storage Buckets: `store-logos`, `store-covers` (Supabase Storage)

**Testing**:
- Unit Tests: Node test runner / Vitest
- Type Checking: `tsc --noEmit`

**Target Platform**: Cloudflare Workers (SSR pass-through) + Modern Web Browsers

**Project Type**: Full-Stack SaaS Tenant Provisioning & Management

**Performance Goals**:
- Real-time debounced slug availability: < 300ms from keystroke
- Complete atomic business provisioning: < 800ms
- Profile settings update: < 400ms

**Constraints**:
- Strict $0 monthly infrastructure cost (Single shared PostgreSQL instance)
- Strict DNS RFC 1123 compliance on all slugs
- Atomic provisioning guarantee (zero orphan business records)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
|---|---|---|
| **I. Spec-Driven & Plan-First** | Work strictly bounded to `specs/003-business-store-management/spec.md` with verified acceptance criteria and quality checklist. | **PASS** |
| **II. Free-First & Zero-Cost Guardrails** | Atomic quota defaults (`max_products = 100`, `max_categories = 15`, `plan_code = 'free'`) assigned to all new businesses. | **PASS** |
| **III. Single Source of Truth for Security** | Business record creation links user as `owner` in `business_members`; future updates protected by `is_business_owner()`. | **PASS** |
| **IV. Mobile-First & Edge Public Experience** | Slug format strictly validates DNS RFC 1123 compatibility for edge `{slug}.digitalmenu...` routing. | **PASS** |
| **V. Decoupled Catalog Domain** | Business creation sets up the master business entity and auto-provisions the primary catalog. | **PASS** |
| **VI. Non-Blocking Dynamics & Privacy** | Slug checking queries only availability boolean without exposing other merchant metadata. | **PASS** |
| **VII. Impeccable Design & Arabic-First** | Store setup and profile forms fully styled in Arabic RTL with real-time badge feedback. | **PASS** |
| **VIII. Database Architecture & Governance** | Operates on standard schema tables in single `public` schema without unapproved DDL edits. | **PASS** |
| **IX. Agent Governance & Scoping** | Execution strictly within scoped files; changes audited and verified. | **PASS** |
| **X. Modular Feature Decomposition** | Feature strictly bounded to `BIZ-001`, cleanly decoupled from `CAT-001` (Catalog) and `PRD-001` (Products). | **PASS** |

*Post-Design Gate Result*: **ALL 10 CONSTITUTIONAL GATES PASSED (10/10)**.

---

## Project Structure

### Documentation (`specs/003-business-store-management/`)

```text
specs/003-business-store-management/
├── spec.md              # Feature specification (Approved)
├── plan.md              # Implementation plan (This file)
├── research.md          # DNS RFC 1123 validation & atomic provisioning research
├── data-model.md        # Entities, Zod schemas, and state machine
├── quickstart.md        # Runnable verification scenarios
├── contracts/
│   └── business-contracts.ts # TypeScript interfaces and types
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Mapping (`src/`)

```text
src/
├── server/
│   └── services/
│       └── business.ts        # BusinessService (createBusiness, checkSlugAvailability, getBusinessByUserId)
├── routes/
│   ├── auth/
│   │   └── register.tsx       # Store creation onboarding form
│   └── _admin.tsx             # Route layout resolving current user's business
```

---

## Core Technical Components & Design

### Component 1: DNS Slug Validator & Normalizer (`src/server/services/business.ts`)
Validates slug compliance against RFC 1123, blocks double hyphens (`--`), rejects reserved platform names, and normalizes inputs to lowercase.

### Component 2: Atomic Store Provisioning Engine (`src/server/services/business.ts`)
Executes transactional store creation:
1. Inserts `businesses` record with free tier defaults.
2. Inserts `business_members` record with `role = 'owner'`.
3. Inserts default `branches` record ("الفرع الرئيسي").
4. Inserts default primary `catalogs` record.
Rolls back on any error to prevent orphan records.

---

## Complexity Tracking

> **No constitutional violations detected. Table kept empty.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | *N/A* | *N/A* |

---

## Phase 0 & Phase 1 Deliverables Summary

1. **Research Artifact**: [`research.md`](./research.md) — Solved DNS RFC 1123 slug constraints and atomic multi-table rollback strategy.
2. **Data Model Artifact**: [`data-model.md`](./data-model.md) — Specified `Business`, `Branch`, and Zod schemas (`createBusinessSchema`, `updateBusinessSchema`).
3. **Contracts Artifact**: [`contracts/business-contracts.ts`](./contracts/business-contracts.ts) — Defined `IBusinessService`, `BusinessEntity`, `BranchEntity`.
4. **Validation Guide**: [`quickstart.md`](./quickstart.md) — Outlined 4 runnable scenarios covering slug checks, store provisioning, and profile updates.
