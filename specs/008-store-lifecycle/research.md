# Technical Research & Architectural Findings: Store and Catalog Lifecycle (LIF-001)

## 1. Domain Decoupling: Business Status vs. Catalog Publication

In a multi-tenant digital menu SaaS, operational status and content visibility must be independently modeled:

| Entity | Field | Type | Values | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Business** | `status` | `business_status` (enum) | `'active'`, `'suspended'`, `'archived'` | Controls tenant account legality, subscription standing, and access rights. |
| **Catalog** | `is_published` | `boolean` | `true`, `false` | Controls whether the merchant is ready for customers to view the current menu items. |

### Lifecycle Evaluation Matrix

| Business Status | Catalog `is_published` | Resolved Public State | HTTP Status | User Message / Response |
| :--- | :--- | :--- | :--- | :--- |
| **Active** | `true` | `active` / `success` | 200 OK | Render storefront & product catalog |
| **Active** | `false` | `unpublished` | 403 Forbidden | Render "هذه القائمة قيد التجهيز حالياً" (Under Preparation) |
| **Suspended** | `true` or `false` | `suspended` | 403 Forbidden | Render "هذا الحساب معطل مؤقتاً" (Account Suspended) |
| **Archived** | `true` or `false` | `suspended` / `archived` | 403 Forbidden | Render "هذا الحساب معطل مؤقتاً" (Account Inactive) |
| *Not Found* | N/A | `not_found` | 404 Not Found | Render "عفواً، المتجر غير موجود" (Store Not Found) |
| *Reserved* | N/A | `reserved` | 404 Not Found | Render "نطاق نظام محجوز" (Reserved System Hostname) |

## 2. Edge Rendering & Caching Strategy

- When a catalog is **active & published**, TanStack Start / Cloudflare Worker caches the response with `public, s-maxage=300, stale-while-revalidate=600`.
- When a catalog is **unpublished, suspended, or not found**, responses MUST specify `Cache-Control: no-cache, no-store, must-revalidate`. This guarantees that if a merchant republishes their store or gets un-suspended, customers see the updated storefront immediately without stale browser or CDN caching.
- Reserved slugs can safely use longer cache durations (`public, max-age=86400`) since reserved infrastructure slugs do not change dynamically.

## 3. Security & Multi-Tenant Authorization

- Changing `is_published` on a catalog requires tenant authentication with `owner` or `admin` role (`TEN-001`).
- Changing `business_status` is restricted to Platform Super Admins (`ADM-001`) or automated billing enforcement jobs. Merchants cannot unilaterally un-suspend their own businesses.
- Database checks leverage existing migrations: `20261106160000_tenant_status_and_dns_constraints.sql` already establishes `business_status` enum ('active', 'suspended', 'archived') and column `businesses.status`.

## 4. Zod 4 Compatibility

All schemas strictly use Zod 4 parameters:
```typescript
import { z } from 'zod';

export const BusinessStatusEnum = z.enum(['active', 'suspended', 'archived']);

export const ToggleCatalogPublishSchema = z.object({
  catalogId: z.string('معرف القائمة مطلوب').uuid('معرف القائمة غير صالح'),
  isPublished: z.boolean(),
});
```

