# Implementation Plan: Tenant Authorization & Data Isolation (TEN-001)

**Branch**: `002-tenant-authorization` | **Feature ID**: `TEN-001` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-tenant-authorization/spec.md`

---

## Summary

Establish an unbypassable multi-tenant security boundary at the database layer (PostgreSQL Row Level Security - RLS). Ensure complete commercial confidentiality between merchants, guarantee that an authenticated user can only access and modify data belonging to their authorized business (`business_id`), and provide safe, read-only access for anonymous public visitors to published catalog data.

---

## Technical Context

**Language/Version**: PostgreSQL 15+ / TypeScript 5.7+ / React 19

**Primary Dependencies**:
- Database Engine: Supabase PostgreSQL (Single-schema `public` multi-tenant)
- Client Driver: `@supabase/supabase-js` (PostgREST over HTTPS)
- Security Primitives: PostgreSQL Row Level Security (RLS), `auth.uid()`, `SECURITY DEFINER` functions

**Storage**:
- PostgreSQL Tables: `public.business_members`, `public.businesses`
- Security Definer Functions: `is_business_member(UUID)`, `is_business_owner(UUID)`

**Testing**:
- Database RLS Policy Tests: SQL role-switching assertions (`SET ROLE anon`, `SET request.jwt.claim.sub`)
- TypeScript Client Contracts: Vitest / Node test runner

**Target Platform**: Cloudflare Workers (PostgREST stateless proxy) + Supabase PostgreSQL Engine

**Project Type**: Multi-Tenant Database Security Architecture & PostgREST API Contracts

**Performance Goals**:
- RLS policy evaluation overhead: < 1ms per query
- Zero policy recursion overhead

**Constraints**:
- Strict $0 monthly infrastructure cost (Single shared PostgreSQL instance)
- Service Role Key strictly barred from client-side bundles and public runtime code
- Single-schema (`public`) domain modeling

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
|---|---|---|
| **I. Spec-Driven & Plan-First** | Bounded strictly to `specs/002-tenant-authorization/spec.md` with verified acceptance criteria and quality checklist. | **PASS** |
| **II. Free-First & Zero-Cost Guardrails** | Shared single-database multi-tenancy with index-backed RLS policies; 0 extra infrastructure cost. | **PASS** |
| **III. Single Source of Truth for Security** | PostgreSQL RLS is the supreme, unbypassable boundary. Route guards are strictly UX aids. | **PASS** |
| **IV. Mobile-First & Edge Public Experience** | Anonymous read-only policies allow instant edge caching of public catalogs without auth overhead. | **PASS** |
| **V. Decoupled Catalog Domain** | RLS policies uniformly enforce `business_id` scoping across catalog, product, and category domains. | **PASS** |
| **VI. Non-Blocking Dynamics & Privacy** | Cross-tenant queries return 0 rows without disclosing record existence or metadata. | **PASS** |
| **VII. Impeccable Design & Arabic-First** | Error messages and unauthorized fallbacks mapped to natural Arabic screens. | **PASS** |
| **VIII. Database Architecture & Governance** | Changes modeled as timestamped incremental migrations in single `public` schema. | **PASS** |
| **IX. Agent Governance & Scoping** | Execution strictly scoped to `TEN-001`. No unapproved DDL execution. | **PASS** |
| **X. Modular Feature Decomposition** | Feature strictly bounded to authorization (`TEN-001`), cleanly decoupled from identity (`IDN-001`) and store setup (`BIZ-001`). | **PASS** |

*Post-Design Gate Result*: **ALL 10 CONSTITUTIONAL GATES PASSED (10/10)**.

---

## Project Structure

### Documentation (`specs/002-tenant-authorization/`)

```text
specs/002-tenant-authorization/
├── spec.md              # Feature specification (Approved)
├── plan.md              # Implementation plan (This file)
├── research.md          # RLS recursion avoidance & security definer design
├── data-model.md        # Security entities, roles, and RLS policy matrix
├── quickstart.md        # Runnable SQL & API cross-tenant isolation test guide
├── contracts/
│   ├── tenant-contracts.ts # TypeScript interfaces for tenant authorization
│   └── rls-policies.sql    # Complete SQL DDL for functions and RLS policies
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Mapping (`src/`)

```text
src/
├── server/
│   ├── db/
│   │   └── supabase.ts        # Client initialization with PostgREST
│   └── services/
│       └── business.ts        # Business & membership query service
├── routes/
│   └── _admin.tsx             # Tenant-scoped admin guard checking business membership
```

---

## Core Technical Components & Design

### Component 1: Non-Recursive Security Definer Functions (`rls-policies.sql`)
Prevents infinite recursion when evaluating `business_members` by using PostgreSQL `SECURITY DEFINER` functions with `STABLE` caching.

### Component 2: Universal `business_id` Scoping
Every table query through PostgREST is automatically filtered by `auth.uid()` matching `business_members.user_id`.

### Component 3: Anonymous Public Read-Only Gateway
Grants `anon` role read access strictly to published catalog items and active businesses, while write operations are unconditionally blocked.

---

## Complexity Tracking

> **No constitutional violations detected. Table kept empty.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | *N/A* | *N/A* |

---

## Phase 0 & Phase 1 Deliverables Summary

1. **Research Artifact**: [`research.md`](./research.md) — RLS policy recursion solution, index design, and anonymous public access rules.
2. **Data Model Artifact**: [`data-model.md`](./data-model.md) — Specified `BusinessMember` schema, tenant roles, and the comprehensive 10-table policy matrix.
3. **Contracts Artifacts**: [`contracts/tenant-contracts.ts`](./contracts/tenant-contracts.ts) and [`contracts/rls-policies.sql`](./contracts/rls-policies.sql).
4. **Validation Guide**: [`quickstart.md`](./quickstart.md) — 5 runnable scenarios proving cross-tenant isolation and anonymous protection.
