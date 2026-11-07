# Feature Specification: Store and Catalog Lifecycle (LIF-001)

**Feature ID**: `LIF-001`  
**Status**: Ready for Implementation  
**Release**: MVP  
**Source Integration**: BIZ-001, CAT-001, DOM-001, TEN-001

---

## 1. Purpose and Business Value

Control when a merchant's storefront is accessible to the public while providing deterministic, localized, and graceful edge handling for unavailable stores. Store lifecycle separates merchant-level operational status (`active`, `suspended`, `archived`) from catalog-level presentation status (`is_published: true/false`), ensuring that public visitors receive instant, branded Arabic status messages without leaking internal system states or serving stale caches.

---

## 2. Actors and Permissions

- **Merchant Owner / Admin (`TEN-001`)**: Can toggle their business catalog's publication state (`is_published: true/false`) and view public availability indicators.
- **Platform Super Admin (`ADM-001`)**: Can change business operational status (`active`, `suspended`, `archived`) and place stores in maintenance or review.
- **Public Visitor / Customer**: Requests storefront by subdomain or slug (`{slug}.digitalmenu.daleel-al-suez.com` or `/c/{slug}`) and receives either the live catalog or a localized Arabic edge response.

---

## 3. User Stories

### User Story 1: Catalog Publication Toggle (P1 - Priority: Highest)
**As a** merchant store owner or admin,  
**I want to** toggle my catalog's publication state (`is_published`) on or off,  
**So that** I can prepare my menu, add products, and configure prices privately before opening the store to customers, or temporarily pause public browsing during inventory adjustments.

- **Acceptance Criteria**:
  - `toggleCatalogPublication` updates `catalogs.is_published` atomically.
  - When `is_published = false`, public catalog fetches return `type: 'unpublished'`.
  - When `is_published = true` and business is `active`, public catalog fetches return `type: 'success'`.
  - Only authenticated users with `owner` or `admin` role on the business can toggle publication.

### User Story 2: Business Operational Status Management (P1 - Priority: Highest)
**As a** platform administrator (or automated governance check),  
**I want to** transition a business status between `active`, `suspended`, and `archived`,  
**So that** delinquent, violating, or closed businesses cannot serve content to the public or mutate data.

- **Acceptance Criteria**:
  - Business status is strictly restricted to enum values: `'active' | 'suspended' | 'archived'`.
  - Setting a business to `'suspended'` immediately causes all public catalog lookups to return `type: 'suspended'` and prevents active catalog browsing.
  - Setting a business to `'archived'` freezes the store, returning `type: 'suspended'` or `type: 'not_found'` for public viewers.
  - State changes take effect immediately without depending on client-side state.

### User Story 3: Edge Availability Resolution & Arabic Error Page Rendering (P1 - Priority: High)
**As a** public customer scanning a QR code or visiting a store link,  
**I want to** see an informative, RTL-first Arabic page explaining the store status,  
**So that** I understand why the menu is unavailable (under construction, temporarily suspended, or not found) without encountering browser technical errors or raw JSON.

- **Acceptance Criteria**:
  - Unregistered / non-existent slugs return HTTP 404 with Arabic "عفواً، المتجر غير موجود".
  - Unpublished catalogs return HTTP 403 with Arabic "هذه القائمة قيد التجهيز حالياً".
  - Suspended or archived stores return HTTP 403 with Arabic "هذا الحساب معطل مؤقتاً".
  - Reserved system slugs return HTTP 404 with Arabic "نطاق نظام محجوز".
  - Responses include correct `Cache-Control` headers: `no-cache, no-store, must-revalidate` for unpublished/suspended/not-found to prevent caching offline states.

---

## 4. Functional Requirements

- **FR-001**: System MUST provide `LifecycleService` handling `setCatalogPublication`, `setBusinessStatus`, and `resolveStoreAvailability`.
- **FR-002**: System MUST validate input payloads using Zod 4 schemas (`ToggleCatalogPublishSchema`, `UpdateBusinessStatusSchema`).
- **FR-003**: System MUST verify tenant membership and permissions before allowing catalog publication toggle (`owner` or `admin` required).
- **FR-004**: System MUST check business status prior to catalog publication status (a suspended business with a published catalog MUST still be resolved as `suspended`).
- **FR-005**: Public edge responses MUST output lightweight, zero-dependency HTML with `lang="ar" dir="rtl"` and responsive styling.
- **FR-006**: Resolution of unavailable states MUST never expose internal IDs, user emails, or database error details.

---

## 5. Non-Functional Requirements & Constitutional Guardrails

- **Principle I (Arabic RTL First)**: All error layouts and status cards use Cairo/system-ui RTL typography and standard Egyptian dialect terminology.
- **Principle II (Cost-Free Architecture)**: Store lifecycle checks run at Cloudflare Worker edge and Supabase with zero paid infrastructure.
- **Principle IV (Multi-Tenant Isolation)**: State updates strictly require `business_id` scoping and RLS tenant verification.
- **Principle IX (Zod 4 Syntax)**: All validation schemas use Zod 4 rules (`z.string('...')` instead of legacy Zod 3 params).

---

## 6. Success Metrics & Edge Cases

- **Availability Accuracy**: 100% deterministic resolution matching `(business.status, catalog.is_published)` matrix.
- **Zero Raw Leaks**: 0 instances of raw Postgres errors, unhandled exceptions, or blank screens exposed to visitors.
- **Edge Cache Invalidation**: Status change takes effect on the next client request without stale cache prolonging offline access.
