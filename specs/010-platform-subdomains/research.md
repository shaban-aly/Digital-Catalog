# Architectural Research: Multi-Tenant Dynamic Subdomains

**Feature**: `002-dynamic-subdomains` | **Date**: 2026-11-06 | **Status**: Complete & Verified

---

## 1. Executive Summary & Objective

This research investigates the technical architecture required to introduce dynamic, multi-tenant subdomains under `daleel-al-suez.com` for the Digital Catalog Platform. 
Each merchant will receive a dedicated, brandable subdomain (e.g., `https://ahmed-cafe.daleel-al-suez.com/`) that renders their published catalog at the root path (`/`), while strictly preserving all existing websites, applications, DNS records, and Vercel deployments.

---

## 2. Deep Dive: Investigation of Existing Architecture (10 Decisions)

### 1. HTTP Request Lifecycle
- **Finding**: The application runs as a Cloudflare Worker via `@cloudflare/vite-plugin`. The entry point is `src/server/entry-worker.ts`, which exports a standard WinterCG `fetch(request: Request, _env: Env, ctx: ExecutionContext)` handler.
- **Verification**: All HTTP requests terminate at Cloudflare's edge proxy. The `request.url` contains the full URL with protocol and hostname (e.g., `https://ahmed-cafe.daleel-al-suez.com/`). Headers include `Host`, `cf-connecting-ip`, and Cloudflare metadata (`cf.*`).

### 2. TanStack Start SSR & Request Context
- **Finding**: TanStack Start (`@tanstack/react-start` `^1.169.4` and `@tanstack/react-router` `^1.170.46`) uses `createStartHandler(defaultStreamHandler)` to render routes to a streaming HTML response.
- **Mechanism**: TanStack Router is file-based (`src/routes/`). In the existing architecture, the public catalog lives at `src/routes/_public/c/$catalogSlug.tsx`.
- **Edge Rewriting Capability**: Because the Worker controls the `fetch` handler before invoking `fetchHandler(request)`, incoming requests to `https://<slug>.daleel-al-suez.com/` can be internally rewritten to `/c/<slug>` before dispatching to TanStack Start. This allows the battle-tested catalog page to render directly at the subdomain root (`/`) without duplicating UI components, routes, or loaders.

### 3. Cloudflare Worker Configuration
- **Finding**: Configured in `wrangler.jsonc` with `"name": "digital-catalog"`, `"compatibility_date": "2026-01-01"`, `"compatibility_flags": ["nodejs_compat"]`, and `"workers_dev": true`.
- **Assets Binding**: Uses `"assets": { "directory": "./dist/client", "binding": "ASSETS", "html_handling": "auto-trailing-slash" }`.
- **Asset Serving**: `entry-worker.ts` explicitly delegates static requests (`/assets/*`, `.svg`, `.ico`) to `_env.ASSETS.fetch(request)`. This ensures CSS, JS bundles, and favicon assets are served uniformly across any subdomain with correct MIME types and zero SSR overhead.

### 4. Supabase Initialization & Access Architecture
- **Finding**: Supabase is initialized in `src/server/db/supabase.ts` using `@supabase/supabase-js`.
- **Stateless PostgREST**: Requests travel over HTTPS PostgREST queries, ensuring zero TCP connection pool exhaustion on Cloudflare Workers Free (10ms CPU limit).
- **Security**: Public catalog loaders use the public client with the Publishable Anon Key. Authenticated routes use `createAuthenticatedClient(jwt)` to enforce PostgreSQL RLS policies tied to `auth.uid()`.

### 5. Data Entities & Tenant Boundaries
- **Finding**:
  - `businesses`: The core tenant entity (`id`, `name`, `slug`, `currency_code`, `plan_code`, `status`).
  - `catalogs`: The curated presentation belonging to a business (`business_id`, `slug`, `is_published`).
  - `catalog_items`: Join table between `catalogs` and `products` defining display price, sort order, and availability.
  - `products`, `product_variants`, `product_option_groups`, `product_media`: Master catalog inventory scoped by `business_id`.

### 6. Existing Tenant Slug Field
- **Finding**: **CONFIRMED**. The `businesses` table already has a `slug` column (`TEXT NOT NULL UNIQUE`).
- **Data Model**: `specs/001-core-catalog-platform/data-model.md` defines `slug TEXT UNIQUE NOT NULL`.
- **Current Usage**: During registration, `create_merchant_business` RPC generates a clean slug from the business name and sets both `businesses.slug` and `catalogs.slug` to this value.

### 7. Database Schema Support for Unique Tenant Slugs
- **Finding**: While `businesses.slug` has a `UNIQUE` constraint, it currently lacks:
  1. **Case-Insensitive Uniqueness**: `ahmed-cafe` and `Ahmed-Cafe` could theoretically collide without a `LOWER(slug)` unique index.
  2. **RFC 1123 DNS Format Validation**: A database check constraint enforcing DNS-compatible labels (lowercase alphanumeric with single hyphens, 3–63 chars).
  3. **Explicit Business Status**: An active/suspended status on `businesses` to distinguish active merchants from disabled/suspended tenants.
  4. **Reserved Slugs Protection**: A registry table and trigger preventing merchants from claiming reserved system subdomains (`admin`, `api`, `tools`, `www`, `digitalmenu`, etc.).

### 8. Existing `digitalmenu` Custom Domain Handling
- **Finding**: `digitalmenu.daleel-al-suez.com` is configured in `wrangler.jsonc` as a Cloudflare Worker Custom Domain (`"custom_domain": true, "zone_name": "daleel-al-suez.com"`).
- **Purpose**: Serves the platform core (marketing landing page at `/`, merchant authentication at `/auth/*`, merchant dashboard at `/dashboard/*`, QR generator, and fallback path `/c/:catalogSlug`).
- **Isolation**: Must remain the primary platform domain and cannot be repurposed as a merchant subdomain.

### 9. Routing Architecture Compatibility
- **Finding**: The routing architecture fully supports hostname-based tenant resolution without breaking existing routes:
  - If `hostname === 'digitalmenu.daleel-al-suez.com'` or `localhost`: Serve standard platform routes (`/`, `/dashboard`, `/auth/*`, `/c/:slug`).
  - If `hostname` is a valid merchant subdomain (e.g., `ahmed-cafe.daleel-al-suez.com`):
    - Subdomain slug is extracted (`ahmed-cafe`).
    - Verified against the reserved slugs list.
    - If `pathname === '/'`, internally rewrite to `/c/ahmed-cafe`.
    - TanStack Start renders the public catalog with SEO canonical URL set to `https://ahmed-cafe.daleel-al-suez.com/`.

### 10. Route, Middleware, and Cache Conflicts
- **Finding**:
  - **No Cache Contamination**: Cloudflare CDN's default cache key includes `{scheme}://{host}{path}{query}`. Content cached for `ahmed-cafe.daleel-al-suez.com/` will NEVER be served to `sara-fashion.daleel-al-suez.com/` or `digitalmenu.daleel-al-suez.com/`.
  - **Static Assets Collision Free**: Assets are loaded from `/assets/...` which is path-independent and served directly from Worker Assets.
  - **Cloudflare Route Conflict Risk**: When the wildcard route `*.daleel-al-suez.com/*` is configured in Cloudflare, it will intercept ALL subdomains unless explicit **Worker Bypass Routes** (`(none)`) are created for `tools.daleel-al-suez.com/*`, `www.daleel-al-suez.com/*`, and `daleel-al-suez.com/*`.

---

## 3. Cloudflare Wildcard Routing Mechanics & Vercel Coexistence

### The Problem
`daleel-al-suez.com` has multiple production applications across different hosting providers:
- **Vercel**:
  - `daleel-al-suez.com` (Main Website)
  - `www.daleel-al-suez.com` (Main Website Alias)
  - `tools.daleel-al-suez.com` (Independent Tools App)
- **Cloudflare Workers**:
  - `digitalmenu.daleel-al-suez.com` (Digital Catalog Main Platform)
  - `*.daleel-al-suez.com` (Future Dynamic Merchant Subdomains)

### Cloudflare Routing Hierarchy & Precedence Rules
Cloudflare evaluates incoming requests using a strict priority order:

```
1. Cloudflare Workers Custom Domains (Exact match: digitalmenu.daleel-al-suez.com)
2. Cloudflare Worker Routes (Ordered by specificity)
   a. Specific Route with Worker: None (e.g. tools.daleel-al-suez.com/* -> Bypass to Vercel)
   b. Specific Route with Worker: None (e.g. www.daleel-al-suez.com/* -> Bypass to Vercel)
   c. Specific Route with Worker: None (e.g. daleel-al-suez.com/* -> Bypass to Vercel)
   d. Wildcard Route (e.g. *.daleel-al-suez.com/* -> digital-catalog Worker)
3. Standard Cloudflare DNS Proxy (Proxied CNAME/A records pointing to Vercel)
```

### Critical Architecture Rule
> [!CAUTION]
> If a wildcard Worker route `*.daleel-al-suez.com/*` is added without explicit bypass routes, Cloudflare will route traffic for `tools.daleel-al-suez.com` and `www.daleel-al-suez.com` into the `digital-catalog` Worker, causing a severe production outage on the Vercel apps!
> 
> Therefore, before activating the wildcard route in Cloudflare, three explicit bypass routes MUST be created in Cloudflare:
> - `tools.daleel-al-suez.com/*` → Worker: **None**
> - `www.daleel-al-suez.com/*` → Worker: **None**
> - `daleel-al-suez.com/*` → Worker: **None**

---

## 4. RFC 1123 DNS Subdomain Slug Validation Rules

A merchant slug must adhere strictly to internet standards for DNS labels (RFC 1035 / RFC 1123):
1. **Length**: Minimum 3 characters, maximum 63 characters.
2. **Allowed Characters**: Lowercase ASCII letters (`a-z`), digits (`0-9`), and hyphens (`-`).
3. **No Leading/Trailing Hyphens**: Must begin and end with an alphanumeric character (`^[a-z0-9]...[a-z0-9]$`).
4. **No Consecutive Hyphens**: Cannot contain `--` (prevents punycode/IDN spoofing like `xn--`).
5. **No Uppercase**: Slugs must be normalized to lowercase prior to validation.
6. **No Unicode / Arabic in DNS Labels**: While business names support Arabic (`name: "مطعم بطيخة"`), the subdomain slug MUST be English/ASCII (`slug: "bateekha-restaurant"`). Punycode subdomains cause browser security warnings and poor mobile keyboard usability.

---

## 5. Security & Tenant Isolation Analysis

1. **Untrusted Headers**:
   - Attackers can forge `X-Forwarded-Host` or `Host` headers when reverse proxies are misconfigured.
   - **Protection**: In Cloudflare Workers, `new URL(request.url).hostname` is extracted directly from the verified TLS SNI and HTTP/2 / HTTP/3 authority pseudo-header validated by Cloudflare's edge network. We NEVER read `X-Forwarded-Host` unless verified against Cloudflare's internal trusted proxy signatures.
2. **Database Query Scoping**:
   - Catalog lookup queries MUST filter by `slug` AND `is_published = true` AND `business.status = 'active'`.
   - Categories, products, and catalog items queries MUST include `.eq('business_id', resolvedBusiness.id)` as an unbypassable compound condition.
3. **Admin Dashboard Isolation**:
   - Subdomains will NEVER serve the merchant dashboard (`/dashboard`).
   - If an authenticated merchant visits `https://ahmed-cafe.daleel-al-suez.com/dashboard`, the edge router immediately 302 redirects them to `https://digitalmenu.daleel-al-suez.com/dashboard`.
   - The admin dashboard lives solely on the canonical platform domain `digitalmenu.daleel-al-suez.com`.

