---
description: "Task list for Core Digital Catalog & QR Platform implementation"
---

# Tasks: Core Digital Catalog & QR Platform (Superseded Integration Tasks)

> Do not execute these consolidated tasks. They are source material for feature-level task lists created only after an approved feature plan.

**Input**: Design documents from `/specs/001-core-catalog-platform/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/catalog-api.ts](./contracts/catalog-api.ts)

**Organization**: Tasks are grouped by phase and user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description with file path`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3], [US4], [US5])
- All file paths are explicit

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, styling configuration, and edge build pipeline.

- [x] T001 Configure Tailwind CSS with Arabic RTL support and semantic design tokens in `tailwind.config.ts` and `src/client/styles/globals.css`
- [x] T002 [P] Configure TanStack Start with `@cloudflare/vite-plugin` and `@tanstack/react-start/plugin/vite` in `vite.config.ts`
- [x] T003 [P] Setup Cloudflare Workers configuration with custom domain route `digitalmenu.daleel-al-suez.com` in `wrangler.jsonc`
- [x] T004 [P] Setup Supabase client initialization with PostgREST HTTPS and environment variables in `src/server/db/supabase.ts`
- [x] T005 [P] Setup shared Zod validation schemas and TypeScript types in `src/shared/schemas.ts` and `src/shared/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database schema, storage abstraction, and base layout primitives that all user stories depend upon.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Apply full PostgreSQL database DDL with 13 tables, RLS policies, and atomic quota trigger from `specs/001-core-catalog-platform/contracts/database-schema.sql` to Supabase
- [x] T007 [P] Implement client-side image compression utility (WebP < 100KB, max 1080px) in `src/client/utils/image-compressor.ts`
- [x] T008 [P] Implement Supabase Storage service abstraction with Cloudflare CDN URL rewriting in `src/server/services/storage.ts`
- [x] T009 [P] Implement TanStack Router root layout and HTML document head with Arabic RTL direction in `src/routes/__root.tsx`
- [x] T010 [P] Implement reusable UI design primitives (Button, Input, Card, Badge, Sheet, Dialog) in `src/client/components/ui/`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Merchant Registration & Inventory Setup (Priority: P1) 🎯 MVP

**Goal**: A merchant registers an account, sets up their store profile with a default branch, organizes up to 15 categories, adds up to 100 master products with browser-compressed images, and configures variants and options.

**Independent Test**: Register a new merchant, create 3 categories, add 5 products with images, variants, and options, and verify persistence in Supabase under tenant isolation. Verify that creating the 101st product is atomically rejected.

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement Merchant Authentication service and hooks using Supabase Auth in `src/client/hooks/use-auth.ts`
- [x] T012 [P] [US1] Implement Auth UI routes (Login, Register) in `src/routes/auth/login.tsx` and `src/routes/auth/register.tsx`
- [x] T013 [US1] Implement Business Profile & Default Branch setup handler in `src/server/services/business.ts`
- [x] T014 [P] [US1] Implement Category management service and components (enforcing max 15 categories) in `src/server/services/category.ts` and `src/client/components/forms/CategoryForm.tsx`
- [x] T015 [US1] Implement Product service with atomic quota check (enforcing max 100 products, max 3 images) in `src/server/services/product.ts`
- [x] T016 [P] [US1] Implement Product Form with Variant and Option Group builders in `src/client/components/forms/ProductForm.tsx` and `src/client/components/forms/VariantEditor.tsx`
- [x] T017 [US1] Implement Merchant Dashboard Products Table view using TanStack Table in `src/routes/_admin/dashboard/products.tsx`

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Consumer Public Catalog Browsing (Priority: P2)

**Goal**: An end consumer visits `https://digitalmenu.daleel-al-suez.com/c/:catalogSlug` on a mobile browser; page loads in under 1.2s via Edge SSR, displays store logo, categories, product cards, detail drawer with variant/option selections, and dynamic price calculation.

**Independent Test**: Navigate to `/c/:catalogSlug` on a mobile viewport, verify sub-second load, filter by category, tap a product, toggle sizes and extras, and confirm price updates in real-time.

### Implementation for User Story 2

- [x] T018 [US2] Implement single-query public catalog data loader resolving business, categories, products, variants, and options in `src/server/services/public-catalog.ts`
- [x] T019 [US2] Implement Public Catalog SSR route with Cloudflare Edge Caching headers (`Cache-Control: public, s-maxage=300`) in `src/routes/_public/c/$catalogSlug.tsx`
- [x] T020 [P] [US2] Implement Public Catalog Header & Cover component in `src/public-catalog/components/CatalogHeader.tsx`
- [x] T021 [P] [US2] Implement Sticky Horizontal Category Navigation in `src/public-catalog/components/CategoryPills.tsx`
- [x] T022 [P] [US2] Implement Product Card component with WebP image rendering and price display in `src/public-catalog/components/ProductCard.tsx`
- [x] T023 [US2] Implement Item Detail Drawer with dynamic variant/modifier price calculation in `src/public-catalog/components/ItemDetailDrawer.tsx`
- [x] T024 [P] [US2] Implement Dynamic OpenGraph tags and JSON-LD Schema.org builder in `src/public-catalog/seo/structured-data.ts`

**Checkpoint**: User Stories 1 and 2 work seamlessly together.

---

## Phase 5: User Story 3 - Permanent Dynamic QR Code Generation & Routing (Priority: P3)

**Goal**: Merchant generates and downloads a branded QR code. Scanning `/q/:shortCode` executes an immediate HTTP 302 redirect to the active catalog URL in <50ms with asynchronous, privacy-safe analytics logging.

**Independent Test**: Generate a QR code from the dashboard, download PNG/SVG, scan the code, confirm immediate redirection to the catalog, and verify that the scan event is recorded with bot filtering and daily salted hashing.

### Implementation for User Story 3

- [x] T025 [US3] Implement QR Code generation service producing stable short codes in `src/server/services/qr.ts`
- [x] T026 [P] [US3] Implement QR Preview & Download modal (PNG/SVG) in `src/client/components/qr/QRDownloadModal.tsx`
- [x] T027 [US3] Implement fast 302 QR Redirect route handler in `src/server/routes/q.$shortCode.ts` resolving destination in <50ms
- [x] T028 [US3] Implement asynchronous, privacy-safe analytics logging via `ctx.waitUntil` (daily salted HMAC fingerprint, bot filtering) in `src/server/services/analytics.ts`

**Checkpoint**: QR codes resolve instantly and track usage without blocking traffic.

---

## Phase 6: User Story 4 - Direct WhatsApp Order & Inquiry Conversion (Priority: P4)

**Goal**: Consumer browsing the catalog taps "Order via WhatsApp"; WhatsApp opens pre-filled with the merchant's phone number and a structured message containing item name, selected variants, chosen options, and the total calculated price.

**Independent Test**: Customize a product on the mobile catalog, click "Order via WhatsApp", and verify WhatsApp opens with the exact item breakdown and correct merchant phone number.

### Implementation for User Story 4

- [x] T029 [US4] Implement WhatsApp message formatting utility in `src/public-catalog/utils/whatsapp-formatter.ts` encoding phone, item, variants, options, and calculated price
- [x] T030 [US4] Implement Floating WhatsApp Sticky Action Bar in `src/public-catalog/components/WhatsAppStickyBar.tsx`
- [x] T031 [US4] Integrate WhatsApp direct order action inside `src/public-catalog/components/ItemDetailDrawer.tsx` with instant click tracking

**Checkpoint**: Direct WhatsApp commerce conversion functions with complete pricing fidelity.

---

## Phase 7: User Story 5 - Real-time Management & Basic Visitor Insights (Priority: P5)

**Goal**: Merchant monitors total QR scans, catalog views, and WhatsApp clicks from their dashboard, and toggles product availability with instant reflection on the live public catalog.

**Independent Test**: Scan the QR code, click the WhatsApp button, log into the dashboard, verify metrics reflect both actions, toggle a product to "Out of Stock", and verify the live public catalog immediately reflects the update.

### Implementation for User Story 5

- [x] T032 [US5] Implement Analytics aggregation service for total scans, views, and WhatsApp clicks in `src/server/services/analytics-summary.ts`
- [x] T033 [P] [US5] Implement Merchant Analytics Dashboard view with metric cards in `src/routes/_admin/dashboard/index.tsx`
- [x] T034 [US5] Implement instant product availability toggle in `src/client/components/tables/ProductRowActions.tsx` with on-demand cache purge dispatch

**Checkpoint**: All 5 user stories are functional, integrated, and verifiable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Production hardening, SEO indexing, automated backups, and build verification.

- [x] T035 [P] Implement dynamic Sitemap generator streaming published catalogs in `src/server/routes/sitemap.xml.ts`
- [x] T036 [P] Implement dynamic Robots.txt route in `src/server/routes/robots.txt.ts`
- [x] T037 [P] Setup automated daily encrypted backup workflow (`pg_dump` + `age` encryption to Cloudflare R2) in `.github/workflows/backup.yml`
- [x] T038 [P] Setup keep-alive ping workflow to prevent Supabase Free inactivity pause in `.github/workflows/keep-alive.yml`
- [x] T039 Verify end-to-end TypeScript compilation (`tsc --noEmit`) and Cloudflare Worker production build (`vite build`)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Independent — can begin immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: Depend on Foundational phase completion.
  - US1 (P1): Foundational for creating catalog content.
  - US2 (P2): Depends on US1 data structures to render public catalog.
  - US3 (P3): Depends on US1/US2 to redirect to active catalog URL.
  - US4 (P4): Depends on US2 public catalog and item drawer components.
  - US5 (P5): Depends on US1-US4 to display aggregated insights and toggle availability.
- **Polish (Phase 8)**: Depends on all user stories completing.

### Parallel Opportunities
- In Phase 1: T002, T003, T004, T005 can run in parallel.
- In Phase 2: T007, T008, T009, T010 can run in parallel.
- In Phase 3: T011, T012 can run in parallel; T014, T016 can run in parallel.
- In Phase 4: T020, T021, T022, T024 can run in parallel.
- In Phase 5: T026 can run in parallel with T025.
- In Phase 8: T035, T036, T037, T038 can run in parallel.

---

## Implementation Strategy: Incremental Delivery

1. **Step 1: Setup & Foundation (Phases 1-2)**: Establish Cloudflare Worker Vite build, Supabase DDL, WebP compression, and design tokens.
2. **Step 2: MVP Increment (Phase 3 - US1)**: Merchant signs up, sets up store, adds categories and products with images and variants.
3. **Step 3: Public Experience Increment (Phase 4 - US2)**: Public customers browse catalogs on mobile with sub-second SSR.
4. **Step 4: QR & Conversion Increment (Phases 5-6 - US3 & US4)**: Dynamic QR redirection and WhatsApp ordering conversion.
5. **Step 5: Insights & Hardening (Phases 7-8 - US5 & Polish)**: Analytics metrics, cache purge, sitemaps, backups, and final build validation.

