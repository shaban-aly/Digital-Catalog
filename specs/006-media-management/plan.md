# Implementation Plan: Product Media Management (MED-001)

**Branch**: `006-media-management` | **Feature ID**: `MED-001` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-media-management/spec.md`

---

## Summary

Allow merchants to enrich their catalog items with fast, high-quality, lightweight food and retail imagery optimized specifically for mobile network browsing (3G/4G). Enforces client-side WebP transformation (capping dimensions to 1080px and compressed file size to under 100KB), reducing bandwidth by >75% and ensuring zero storage exhaustion on the Free tier. Supports cover image selection, gallery ordering, and atomic deletion with storage cleanup.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / PostgreSQL 15+ / React 19 / HTML5 Canvas API

**Primary Dependencies**:
- Full-stack Framework: `@tanstack/react-start` (Vite-powered edge SSR)
- Storage Client: `@supabase/supabase-js` (Supabase Storage over HTTPS)
- Validation: `zod`
- Icons & UI: `lucide-react`, `tailwindcss`

**Storage**:
- PostgreSQL Table: `public.product_media`
- Storage Bucket: `product-images` (Public read-only, max file size 200KB)
- Index: `idx_media_product (product_id, sort_order)`

**Testing**:
- Unit Tests: Node native test runner (`node:test`, `node:assert/strict`)
- Type Checking: `npx tsc --noEmit`

**Target Platform**: Cloudflare Workers (SSR pass-through) + Modern Web Browsers

**Project Type**: Client-Side Media Compression & Storage Management

**Performance Goals**:
- Client-side WebP compression: < 400ms for typical mobile photo
- Storage upload over 4G: < 1.2s for compressed <100KB asset
- Mobile storefront image load: < 300ms from edge CDN

**Constraints**:
- Strict $0 monthly infrastructure cost (Client-side compression, zero server-side transcoders)
- Max 3 images per product on Free tier
- Strictly `image/webp` format

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
|---|---|---|
| **I. Spec-Driven & Plan-First** | Work strictly bounded to `specs/006-media-management/spec.md` with verified acceptance criteria and quality checklist. | **PASS** |
| **II. Free-First & Zero-Cost Guardrails** | Client-side compression eliminates server image processing; 3-image quota protects storage limits. | **PASS** |
| **III. Single Source of Truth for Security** | Media records inherit parent product RLS authorization scoped to tenant `business_id`. | **PASS** |
| **IV. Mobile-First & Edge Public Experience** | Downscaled to max 1080px and WebP format specifically tuned for fast mobile viewing over 3G/4G. | **PASS** |
| **V. Decoupled Catalog Domain** | Media belongs to master products; public catalogs render media via catalog item product references. | **PASS** |
| **VI. Non-Blocking Dynamics & Privacy** | Media URLs are public assets served through CDN without user tracking parameters. | **PASS** |
| **VII. Impeccable Design & Arabic-First** | Upload zones, progress bars, and format alerts styled in clean Arabic RTL typography. | **PASS** |
| **VIII. Database Architecture & Governance** | Operates on existing `public.product_media` table without unapproved DDL changes. | **PASS** |
| **IX. Agent Governance & Scoping** | Execution strictly within scoped files; changes audited and verified. | **PASS** |
| **X. Modular Feature Decomposition** | Feature strictly bounded to `MED-001`, cleanly decoupled from `PRD-001` (Products) and `LMT-001` (Limits). | **PASS** |

*Post-Design Gate Result*: **ALL 10 CONSTITUTIONAL GATES PASSED (10/10)**.

---

## Project Structure

### Documentation (`specs/006-media-management/`)

```text
specs/006-media-management/
├── spec.md              # Feature specification (Approved)
├── plan.md              # Implementation plan (This file)
├── research.md          # Technical research (WebP, bucket security, quota, cover logic)
├── data-model.md        # Entities, Zod schemas, and validation rules
├── quickstart.md        # Runnable verification scenarios
├── contracts/
│   └── media-contracts.ts   # TypeScript interfaces and contracts
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Mapping (`src/`)

```text
src/
├── client/
│   └── utils/
│       └── image-compressor.ts # Client-side Canvas WebP converter
├── server/
│   └── services/
│       ├── storage.ts          # SupabaseStorageProvider (upload, delete, getPublicUrl)
│       └── media.ts            # MediaService (getProductMedia, uploadProductImage, setCover, delete)
├── shared/
│   ├── types.ts                # ProductMedia interface
│   └── schemas.ts              # ProductMediaInputSchema, UpdateMediaSortSchema
```

---

## Architecture Flow

```mermaid
flowchart TD
    Merchant[Merchant Admin] -->|1. Pick Photo (JPEG/PNG/HEIC)| Input[File Input]
    Input -->|2. Compress & Scale| Comp[image-compressor.ts]
    Comp -->|3. WebP < 100KB| Service[media.ts / storage.ts]
    Service -->|Check count < 3| QuotaCheck{Max 3 Images}
    QuotaCheck -->|Passed| Store[Supabase Bucket: product-images]
    Store --> DB[(public.product_media)]
    QuotaCheck -->|>= 3| QuotaAlert[Return Arabic Quota Alert]
```
