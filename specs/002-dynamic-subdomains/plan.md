# Architecture & Implementation Plan: Multi-Tenant Dynamic Subdomains

**Feature**: `002-dynamic-subdomains` | **Date**: 2026-11-06 | **Status**: Architecture Approved (Planning Only)

---

## 1. System Architecture Overview

The multi-tenant dynamic subdomain architecture operates by leveraging Cloudflare Workers' edge request pipeline combined with TanStack Start's server-side rendering (SSR) capabilities.

```mermaid
graph TD
    Client["Client Browser (Mobile 4G)"] --> EdgeDNS["Cloudflare Edge Proxy (daleel-al-suez.com)"]
    
    subgraph Cloudflare Routing Precedence
        EdgeDNS --> MatchTools{"tools.daleel-al-suez.com?"}
        MatchTools -- Yes --> VercelTools["Bypass to Vercel (Tools App)"]
        MatchTools -- No --> MatchMain{"daleel-al-suez.com or www?"}
        MatchMain -- Yes --> VercelMain["Bypass to Vercel (Main Website)"]
        MatchMain -- No --> MatchPlatform{"digitalmenu.daleel-al-suez.com?"}
        MatchPlatform -- Yes --> WorkerPlatform["digital-catalog Worker (Platform Core)"]
        MatchMain -- No --> MatchWildcard{"*.daleel-al-suez.com?"}
        MatchWildcard -- Yes --> WorkerSubdomain["digital-catalog Worker (Tenant Subdomains)"]
    end

    subgraph Worker Edge Pipeline (entry-worker.ts)
        WorkerSubdomain --> HostnameResolver["Hostname & Tenant Resolver"]
        HostnameResolver --> CheckReserved{"Reserved Slug?"}
        CheckReserved -- Yes --> HTTP404["Return HTTP 404 (Protected)"]
        CheckReserved -- No --> SupabaseLookup["Supabase: Validate Business & Status"]
        SupabaseLookup --> TenantActive{"Tenant Found & Active?"}
        TenantActive -- No --> HTTPNotFound["Return HTTP 404 / 403"]
        TenantActive -- Yes --> EdgeRewriter["Internal Path Rewriter (/ -> /c/:slug)"]
        EdgeRewriter --> TanStackSSR["TanStack Start SSR Engine"]
    end

    subgraph Presentation & Data Layer
        TanStackSSR --> HTMLResponse["Streamed HTML (SEO, Schema.org, WhatsApp CTA)"]
        TanStackSSR --> EdgeCache["Cloudflare CDN Cache (Key: Host + Path)"]
    end
```

---

## 2. Core Technical Components

### Component 1: Edge Hostname Resolution Engine (`src/server/tenant/resolver.ts`)
A dedicated, lightweight edge module executing on Cloudflare Workers with zero external dependencies:

```typescript
export interface TenantResolutionResult {
  isTenantSubdomain: boolean;
  tenantSlug: string | null;
  isPlatformRoot: boolean;
  isReserved: boolean;
  normalizedHost: string;
}

export class TenantResolver {
  private baseDomain: string;
  private platformHost: string;
  private reservedSlugs: Set<string>;

  constructor(baseDomain = 'daleel-al-suez.com', platformHost = 'digitalmenu.daleel-al-suez.com') {
    this.baseDomain = baseDomain.toLowerCase();
    this.platformHost = platformHost.toLowerCase();
    this.reservedSlugs = new Set([
      'daleel-al-suez', 'www', 'tools', 'digitalmenu',
      'admin', 'api', 'app', 'auth', 'login', 'register',
      'dashboard', 'account', 'billing', 'support', 'help',
      'docs', 'status', 'mail', 'webmail', 'smtp', 'ftp',
      'cpanel', 'dev', 'staging', 'test', 'cdn', 'static', 'assets'
    ]);
  }

  resolve(url: URL): TenantResolutionResult {
    // 1. Strip port and normalize to lowercase
    const host = (url.hostname || '').toLowerCase().replace(/\.$/, '');

    // 2. Check Platform Core Domain
    if (host === this.platformHost || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.workers.dev')) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: true,
        isReserved: false,
        normalizedHost: host,
      };
    }

    // 3. Verify that the host ends with the configured base domain
    if (!host.endsWith(`.${this.baseDomain}`)) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: false,
        isReserved: false,
        normalizedHost: host,
      };
    }

    // 4. Extract single subdomain label
    const subpart = host.slice(0, -(this.baseDomain.length + 1));
    
    // Prevent multi-level subdomains (e.g., a.b.daleel-al-suez.com)
    if (subpart.includes('.')) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: false,
        isReserved: true,
        normalizedHost: host,
      };
    }

    // 5. Check against reserved list
    if (this.reservedSlugs.has(subpart)) {
      return {
        isTenantSubdomain: false,
        tenantSlug: subpart,
        isPlatformRoot: false,
        isReserved: true,
        normalizedHost: host,
      };
    }

    // 6. Validate RFC 1123 label format
    const isValidFormat = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(subpart) && !subpart.includes('--');
    if (!isValidFormat) {
      return {
        isTenantSubdomain: false,
        tenantSlug: null,
        isPlatformRoot: false,
        isReserved: false,
        normalizedHost: host,
      };
    }

    return {
      isTenantSubdomain: true,
      tenantSlug: subpart,
      isPlatformRoot: false,
      isReserved: false,
      normalizedHost: host,
    };
  }
}
```

---

### Component 2: Edge Request Interception & URL Rewriting (`src/server/entry-worker.ts`)

In `entry-worker.ts`:
1. **Asset Bypass**: If `url.pathname.startsWith('/assets/')` or ends with an asset extension, serve immediately via `_env.ASSETS.fetch(request)`.
2. **Tenant Evaluation**: Run `tenantResolver.resolve(url)`.
3. **Reserved Subdomain Interception**: If `result.isReserved`, return HTTP 404 with standard security headers.
4. **Merchant Subdomain Root Rewriting**:
   - If `result.isTenantSubdomain && result.tenantSlug`:
     - If `url.pathname === '/'`:
       - Create an internal rewritten `Request` with URL `https://${url.hostname}/c/${result.tenantSlug}` while preserving all headers and request body.
       - Pass to `fetchHandler(rewrittenRequest)`.
       - TanStack Start will execute the loader of `src/routes/_public/c/$catalogSlug.tsx` and render the full SSR catalog with HTTP 200.
     - If `url.pathname.startsWith('/dashboard')` or `url.pathname.startsWith('/auth')`:
       - Issue an HTTP 302 redirect to `https://digitalmenu.daleel-al-suez.com${url.pathname}`.
5. **Main Platform Domain**:
   - If `result.isPlatformRoot`:
     - If `url.pathname.startsWith('/c/')`:
       - Check if merchant slug has a dedicated subdomain and optionally issue an HTTP 301 Permanent Redirect to `https://${slug}.daleel-al-suez.com/`.

---

### Component 3: Canonical SEO & Dynamic Structured Data (`src/public-catalog/seo/structured-data.ts`)

Update `buildCatalogMeta` and `buildCatalogJsonLd` to dynamically use the merchant's real subdomain:

```typescript
export function getCanonicalCatalogUrl(businessSlug: string, requestHost?: string): string {
  // If the request was made on the merchant's subdomain, use root of subdomain
  if (requestHost && requestHost.toLowerCase().startsWith(`${businessSlug.toLowerCase()}.`)) {
    return `https://${requestHost.toLowerCase()}/`;
  }
  // Otherwise use the merchant subdomain as canonical
  return `https://${businessSlug.toLowerCase()}.daleel-al-suez.com/`;
}
```

This ensures:
- Googlebot indexes `https://ahmed-cafe.daleel-al-suez.com/` as the primary canonical URL.
- Duplicate content penalties between `/c/ahmed-cafe` and `ahmed-cafe.daleel-al-suez.com` are completely prevented.

---

### Component 4: Cache Management & Invalidation

1. **Cloudflare CDN Edge Cache**:
   - Public catalog routes return headers:
     `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`
   - Cloudflare CDN's default cache key is `${request.url}` which contains the distinct hostname. Therefore, cached catalog HTML for `ahmed-cafe` and `sara-fashion` are strictly isolated in Cloudflare's edge cache.
2. **Merchant Mutations Invalidation**:
   - When a merchant updates products, prices, or publishing state in the dashboard, the backend triggers a cache purge for `https://${slug}.daleel-al-suez.com/*`.

---

## 3. Database Impact & Migration Governance

- **Logical Domain**: `tenant` (Business & Tenant Management)
- **Existing Tables Affected**:
  - `public.businesses`: Add `status` column, enforce `LOWER(slug)` unique index, enforce RFC 1123 CHECK constraint.
- **New Tables**:
  - `public.reserved_slugs`: Global registry of protected system, infrastructure, and protocol subdomains.
  - `public.tenant_slug_redirects`: Audit history of slug updates for seamless 301 backward compatibility.
- **Columns & Data Types**:
  - `businesses.status`: `public.business_status` ENUM (`'active'`, `'suspended'`, `'archived'`), `NOT NULL DEFAULT 'active'`.
  - `reserved_slugs.id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
  - `reserved_slugs.slug`: `TEXT NOT NULL UNIQUE`.
  - `reserved_slugs.category`: `TEXT NOT NULL DEFAULT 'system'`.
  - `reserved_slugs.reason`: `TEXT NOT NULL`.
  - `reserved_slugs.created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
  - `tenant_slug_redirects.id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
  - `tenant_slug_redirects.business_id`: `UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE`.
  - `tenant_slug_redirects.old_slug`: `TEXT NOT NULL UNIQUE`.
  - `tenant_slug_redirects.new_slug`: `TEXT NOT NULL`.
  - `tenant_slug_redirects.created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- **Primary & Foreign Keys**:
  - `reserved_slugs(id)` PK.
  - `tenant_slug_redirects(id)` PK, `tenant_slug_redirects(business_id)` FK -> `businesses(id) ON DELETE CASCADE`.
- **Unique & Check Constraints**:
  - `idx_businesses_slug_lower_unique`: `CREATE UNIQUE INDEX ON public.businesses (LOWER(slug))`.
  - `chk_business_slug_dns_format`: `CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$' AND slug !~ '--' AND length(slug) >= 3 AND length(slug) <= 63)`.
  - `idx_reserved_slugs_lower`: `CREATE UNIQUE INDEX ON public.reserved_slugs (LOWER(slug))`.
  - `idx_tenant_slug_redirects_old_slug`: `CREATE INDEX ON public.tenant_slug_redirects (LOWER(old_slug))`.
- **RLS Policies**:
  - `reserved_slugs`: `SELECT` granted to `anon` and `authenticated`. Write operations restricted to migrations/superadmin.
  - `tenant_slug_redirects`: `SELECT` granted to `anon` and `authenticated`. `INSERT` restricted to business owners.
- **Functions & Triggers**:
  - `public.is_slug_available(p_slug TEXT) RETURNS BOOLEAN` (`SECURITY DEFINER`, `SET search_path = public`).
  - `public.create_merchant_business(...) RETURNS JSONB` (`SECURITY DEFINER`, `SET search_path = public`).
- **Ordered Migration Files**:
  1. `supabase/migrations/20261106160000_tenant_status_and_dns_constraints.sql`
  2. `supabase/migrations/20261106160500_tenant_reserved_slugs_registry.sql`
  3. `supabase/migrations/20261106161000_tenant_slug_validation_functions.sql`
  4. `supabase/migrations/20261106161500_tenant_slug_redirects.sql`
- **Data Migration Requirements**:
  - Backfill existing `businesses.slug` to lowercase: `UPDATE public.businesses SET slug = LOWER(slug) WHERE slug <> LOWER(slug);`.
  - Verify existing rows satisfy DNS constraint before applying `chk_business_slug_dns_format`.
- **Rollback Strategy**:
  - Documented drop script for constraints and functions; preserve `businesses` table without data loss.
- **Type Generation**:
  - Execute `npx supabase gen types typescript --project-id opgiyqxsthrxzrbgupso > src/shared/database.types.ts`.
4. Adding `chk_business_slug_dns_format` CHECK constraint on `businesses(slug)`.
5. Creating `reserved_slugs` table with 35+ system, infrastructure, and protocol reserved keywords.
6. Creating `is_slug_available(p_slug)` stored procedure.
7. Updating `create_merchant_business` atomic RPC.

---

## 4. Phase 7: Cloudflare Infrastructure Activation Plan (Isolated & Sequenced)

> [!IMPORTANT]
> This phase will NOT be executed during application feature implementation. It will be scheduled only after code implementation, automated tests, and local dry runs are 100% verified.

### Sequence of Activation:
1. **Pre-flight DNS Check**:
   - Verify that `daleel-al-suez.com` (Vercel) returns HTTP 200.
   - Verify that `www.daleel-al-suez.com` (Vercel) returns HTTP 200.
   - Verify that `tools.daleel-al-suez.com` (Vercel) returns HTTP 200.
   - Verify that `digitalmenu.daleel-al-suez.com` (Worker) returns HTTP 200.
2. **Cloudflare Worker Bypass Route Configuration (Protection Gate)**:
   - In Cloudflare Dashboard > Workers & Pages > Routing Rules (or Worker Routes):
     - Route 1: `tools.daleel-al-suez.com/*` → Worker: **None** (Bypass).
     - Route 2: `www.daleel-al-suez.com/*` → Worker: **None** (Bypass).
     - Route 3: `daleel-al-suez.com/*` → Worker: **None** (Bypass).
   - This guarantees that no wildcard routing can ever intercept Vercel traffic.
3. **Cloudflare DNS Wildcard Record**:
   - In Cloudflare DNS for `daleel-al-suez.com`:
   - Add CNAME record:
     - Name: `*`
     - Target: `digitalmenu.daleel-al-suez.com` (or `192.0.2.1` with Proxy Enabled ☁️).
     - Proxy status: **Proxied (Orange Cloud)**.
4. **Cloudflare Worker Wildcard Route**:
   - Add Route: `*.daleel-al-suez.com/*` → Worker: `digital-catalog`.
5. **Post-Activation Verification**:
   - `curl -I https://tools.daleel-al-suez.com` → Verify headers confirm Vercel.
   - `curl -I https://www.daleel-al-suez.com` → Verify headers confirm Vercel.
   - `curl -I https://daleel-al-suez.com` → Verify headers confirm Vercel.
   - `curl -I https://digitalmenu.daleel-al-suez.com` → Verify headers confirm Worker.
   - `curl -I https://shaban.daleel-al-suez.com` → Verify headers confirm Worker + HTTP 200.
   - `curl -I https://non-existent.daleel-al-suez.com` → Verify Worker returns HTTP 404.

