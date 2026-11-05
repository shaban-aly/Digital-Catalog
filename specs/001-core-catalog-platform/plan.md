# Implementation Plan: Core Digital Catalog & QR Platform (Free-First MVP)

**Branch**: `001-core-catalog-platform` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-core-catalog-platform/spec.md`

## Summary

Build the foundational Free-First MVP of the Digital Menu & QR Platform ("ديجيتال منيو") targeted for Egypt and the Suez market (`daleel-al-suez.com`). The system enables local merchants to register, set up their business in Egyptian Pounds (EGP / ج.م), organize up to 15 categories, manage up to 100 master products with browser-compressed WebP images (<100KB), configure hierarchical pricing with variants and options, and generate a dynamic permanent QR code. End consumers access sub-second SSR public catalogs on mobile networks, navigate categories smoothly, and convert directly via an auto-populated WhatsApp message. The infrastructure runs entirely on Cloudflare Workers Free and Supabase Free at $0 initial cost under the primary domain `https://digitalmenu.daleel-al-suez.com/`.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 20+ (LTS) / React 19

**Primary Dependencies**:
- Full-stack Framework: `@tanstack/react-start` (Vite-powered SSR)
- Routing & Data: `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-form`, `@tanstack/react-table`
- Build & Edge: `@cloudflare/vite-plugin`, `wrangler`
- Backend Client: `@supabase/supabase-js` (PostgREST over HTTPS)
- Validation: `zod`
- UI & Styling: `tailwindcss`, `lucide-react`, `clsx`, `tailwind-merge`

**Storage**:
- Database: Supabase PostgreSQL (500 MB Free Tier)
- Media Storage: Supabase Storage bucket (`product-images`) fronted by Cloudflare CDN 30-day cache
- Backups: Scheduled GitHub Actions daily encrypted dump (`age`/`gpg`) stored in private Cloudflare R2 bucket (10 GB Free Tier)

**Testing**:
- Unit & Contract Testing: Vitest
- Schema & Quota Testing: PostgreSQL Trigger unit tests
- Build Verification: `tsc --noEmit` and `vite build`

**Target Platform**: Cloudflare Workers (Edge V8 runtime) + Modern Web Browsers (Mobile-first iOS/Android Safari & Chrome)

**Project Type**: Full-Stack React Web Application with Edge SSR

**Performance Goals**:
- Public Catalog FCP: < 1.2s on standard 4G mobile
- Dynamic QR Redirect (`/q/:shortCode`): HTTP 302 issued in < 50ms
- Edge Cache Hit CPU time: < 1.2ms (Worker Cache API) / 0ms (CDN Edge Cache Rules)
- Single-query public catalog hydration: < 100ms via PostgREST

**Constraints**:
- Strict $0 monthly infrastructure cost during initial launch
- Cloudflare Workers Free: max 100,000 requests/day, max 10ms CPU execution time per request
- Supabase Free: 500 MB DB, 1 GB storage, 2 GB egress bandwidth
- Hard quota: max 100 master products and 15 categories per business, enforced atomically

**Scale/Scope**:
- MVP launch capacity: 50 to 100 active merchants
- Total master products: ~10,000 items
- Total public page views: ~150,000 monthly views

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitutional Principle | Requirement | Plan Status | Architectural Mitigation |
| :--- | :--- | :--- | :--- |
| **I. Spec-Driven & Plan-First** | Approved spec, plan, tasks before code | **PASS** | `spec.md` approved, `plan.md` complete, tasks generated next. |
| **II. Free-First & Zero-Cost** | $0 hosting, <10ms CPU, <2GB Egress | **PASS** | Cloudflare Edge Caching, browser WebP compression, stateless PostgREST. |
| **III. Single Security Source** | PostgreSQL RLS is absolute boundary | **PASS** | RLS enabled on all 13 tables; JWT passed via headers; zero Service Key in client. |
| **IV. Mobile-First Edge SSR** | Sub-second mobile loading, SEO, OG | **PASS** | Edge SSR on Cloudflare Workers, OpenGraph tags, JSON-LD Schema.org. |
| **V. Decoupled Catalog Domain** | `products` vs `catalog_items` separated | **PASS** | Decoupled entities, hierarchical pricing (Product -> Variant -> Option -> Override). |
| **VI. Non-Blocking Dynamics & Privacy** | QR 302 <40ms, zero raw IP storage | **PASS** | Asynchronous `ctx.waitUntil` analytics, daily rotating salted HMAC fingerprinting. |
| **VII. Impeccable Design & Arabic RTL** | RTL-first, Cairo/Readex Pro, tokens | **PASS** | Arabic-first layout, high-contrast tokens, sticky thumb-friendly WhatsApp CTA. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-core-catalog-platform/
├── plan.md              # This file (Implementation Plan)
├── research.md          # Technical research & runtime architecture
├── data-model.md        # Database schema, entities, constraints & RLS
├── quickstart.md        # Developer setup & local runbook
├── checklists/
│   └── requirements.md  # Requirements quality validation checklist
└── contracts/
    ├── catalog-api.ts   # Zod validation schemas & TypeScript types
    └── database-schema.sql # Complete PostgreSQL DDL with RLS & Triggers
```

### Source Code Layout

```text
src/
├── client/                      # Merchant Dashboard & Client SPA Code
│   ├── components/              # Reusable UI primitives (shadcn/ui RTL)
│   │   ├── ui/                  # Button, Input, Dialog, Sheet, Badge, Card
│   │   ├── forms/               # ProductForm, CategoryForm, VariantEditor
│   │   └── layout/              # DashboardSidebar, TopNav, LiveMobilePreview
│   ├── hooks/                   # useProduct, useCategory, useImageUpload
│   └── utils/                   # client-image-compressor.ts (WebP converter)
│
├── public-catalog/              # Consumer Public Catalog (SSR Surface)
│   ├── components/              # Public UI components
│   │   ├── CatalogHeader.tsx    # Store logo, cover, share button
│   │   ├── CategoryPills.tsx    # Horizontal sticky category navigation
│   │   ├── ProductCard.tsx      # Optimized card with price & tags
│   │   ├── ItemDetailDrawer.tsx # Variant & Modifier selection bottom sheet
│   │   └── WhatsAppStickyBar.tsx# Floating thumb-zone WhatsApp CTA
│   └── seo/                     # OpenGraph & JSON-LD Structured Data builders
│
├── server/                      # Edge Server Functions & Handlers
│   ├── entry-worker.ts          # Cloudflare Worker fetch entry point
│   ├── routes/                  # TanStack Router route definitions
│   │   ├── _admin/              # /dashboard, /dashboard/products, etc.
│   │   ├── _public/             # /c/:catalogSlug, /c/:catalogSlug/p/:productId
│   │   ├── q.$shortCode.ts      # Fast 302 QR Redirect handler
│   │   ├── sitemap.xml.ts       # Dynamic sitemap generator
│   │   └── robots.txt.ts        # Dynamic robots.txt
│   ├── db/                      # Supabase client instantiation
│   └── services/                # CatalogService, ProductService, AnalyticsService
│
└── shared/                      # Shared Types & Validation Schemas
    ├── types.ts                 # Generated DB types & domain entities
    └── schemas.ts               # Zod validation contracts
```

---

## Complexity Tracking

*No constitutional violations exist. All gates passed with zero complexity exceptions.*
