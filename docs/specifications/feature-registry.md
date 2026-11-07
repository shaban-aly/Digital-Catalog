# Feature Registry

## Registry Rules

- Feature IDs are stable product identifiers. Directory numbers are Spec Kit sequence numbers and match dependency-ordered delivery.
- `Partial` means relevant source code exists but its full product contract or deployed state has not been validated.
- `Documented` means the requirement exists in a specification but cannot be treated as implemented.
- `Future` identifies an intentionally deferred capability. It has a boundary draft only; it has no plan or tasks.

| ID | Feature | Domain | Priority | Release | Status | Primary dependency | Specification |
|---|---|---|---|---|---|---|---|
| IDN-001 | Identity and access | Identity | P0 | MVP | Implemented & Verified | Supabase identity | [001](../../specs/001-identity-access/spec.md) |
| TEN-001 | Tenant authorization | Tenant | P0 | MVP | Implemented & Verified | IDN-001 | [002](../../specs/002-tenant-authorization/spec.md) |
| BIZ-001 | Business and store management | Tenant | P0 | MVP | Implemented & Verified | TEN-001 | [003](../../specs/003-business-store-management/spec.md) |
| CAT-001 | Catalog and category management | Catalog | P0 | MVP | Implemented & Verified | BIZ-001 | [004](../../specs/004-catalog-management/spec.md) |
| PRD-001 | Product, variant, and modifier management | Product | P0 | MVP | Implemented & Verified | CAT-001 | [005](../../specs/005-product-management/spec.md) |
| MED-001 | Product media | Media | P0 | MVP | Implemented & Verified | PRD-001 | [006](../../specs/006-media-management/spec.md) |
| LMT-001 | Entitlements and usage limits (Subscriptions) | Limits | P0 | MVP | Implemented & Verified | BIZ-001, PRD-001, MED-001 | [007](../../specs/007-usage-limits/spec.md) |
| LIF-001 | Store and catalog lifecycle | Publishing | P1 | MVP | Implemented & Verified | BIZ-001, CAT-001 | [008](../../specs/008-store-lifecycle/spec.md) |
| PUB-001 | Public catalog experience | Public catalog | P0 | MVP | Implemented & Verified | CAT-001, PRD-001, LIF-001 | [009](../../specs/009-public-catalog-experience/spec.md) |
| DOM-001 | Platform subdomains and hostname resolution | Publishing | P0 | MVP | Verified Live ({slug}.digitalmenu...) | BIZ-001, LIF-001, PUB-001 | [010](../../specs/010-platform-subdomains/spec.md) |
| QR-001 | QR code management | Analytics | P0 | MVP | Implemented & Verified | BIZ-001, LIF-001, PUB-001 | [011](../../specs/011-qr-management/spec.md) |
| ANL-001 | Privacy-safe analytics | Analytics | P1 | MVP | Implemented & Verified | QR-001 | [012](../../specs/012-analytics-privacy/spec.md) |
| SEO-001 | SEO and metadata | Public catalog | P1 | MVP | Implemented & Verified | PUB-001, DOM-001 | [013](../../specs/013-seo-metadata/spec.md) |
| MCH-001 | Merchant dashboard workspace | Merchant experience | P1 | MVP | Implemented & Verified | IDN-001, BIZ-001, CAT-001, PRD-001 | [014](../../specs/014-merchant-dashboard/spec.md) |
| COM-001 | WhatsApp ordering and cart | Commerce | P1 | MVP extension | Implemented & Verified | PUB-001 | [015](../../specs/015-whatsapp-cart/spec.md) |
| ADM-001 | Platform Super Admin Dashboard | Administration | P1 | MVP Core | Implemented & Verified | TEN-001, LIF-001, ANL-001 | [016](../../specs/016-platform-admin/spec.md) |
| NOT-001 | Merchant notifications | Notifications | P1 | MVP Core | Implemented & Verified | BIZ-001, COM-001 | [017](../../specs/017-notifications/spec.md) |
| AUD-001 | Audit log | Governance | P1 | MVP Core | Implemented & Verified | TEN-001 | [018](../../specs/018-audit-logs/spec.md) |
| JOB-001 | Background jobs and data retention | Operations | P1 | MVP Core | Implemented & Verified | ANL-001, NOT-001, IMP-001 | [019](../../specs/019-background-jobs/spec.md) |
| IMP-001 | Bulk catalog import | Import | P1 | MVP Core | Implemented & Verified | CAT-001, PRD-001, MED-001 | [020](../../specs/020-bulk-import/spec.md) |
| DOM-002 | External custom domains | Publishing | P1 | Pro Tier | Implemented & Verified | DOM-001, SEO-001 | [021](../../specs/021-external-custom-domains/spec.md) |

## Relevant Existing Sources

| Feature group | Source references | Data references |
|---|---|---|
| Identity, tenants, business | `src/routes/auth`, `src/client/hooks/use-auth.tsx`, `src/server/services/business.ts` | `businesses`, `business_members`, `branches` |
| Catalog, products, media | `src/server/services/category.ts`, `product.ts`, `storage.ts`, `src/client/components/forms` | `categories`, `products`, variants, options, `product_media`, `catalogs`, `catalog_items` |
| Public, domains, SEO | `src/public-catalog`, `src/server/entry-worker.ts`, `src/server/tenant`, `structured-data.ts` | published catalog data and tenant slug records |
| QR and analytics | `src/server/services/qr.ts`, `analytics.ts`, `analytics-summary.ts` | `qr_codes`, `qr_scan_events`, daily metrics contract |
| Platform Administration | `src/routes/_admin.tsx` | Platform metrics, store suspension, plan upgrades |

## Out-of-Registry Items

Design tokens, Arabic RTL rules, edge performance, privacy, and RLS are cross-cutting controls. They remain in the constitution and platform overview instead of becoming duplicate feature specifications.
