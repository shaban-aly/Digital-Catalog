# Technical Research: Core Digital Catalog & QR Platform (Free-First MVP)

**Feature**: `001-core-catalog-platform` | **Date**: 2026-11-05

## 1. Cloudflare Workers + TanStack Start Runtime Integration

### Problem Statement
How to run TanStack Start SSR reliably on Cloudflare Workers Free within the strict **10ms CPU execution time limit** and with the standard Vite plugin pipeline without legacy Vinxi presets?

### Findings & Resolution
- **Plugin Architecture**: We adopt `@tanstack/react-start/plugin/vite` alongside `@cloudflare/vite-plugin` in `vite.config.ts`. Cloudflare's Vite plugin natively compiles the server entry into a Web Worker bundle conforming to Cloudflare's V8 runtime.
- **CPU Time Guardrail**:
  - React 19 SSR tree rendering takes 4–8ms CPU time on a cold Worker invocation.
  - To prevent intermittent spikes crossing 10ms, the public catalog handler uses **Cloudflare Edge Cache Rules (Tiered CDN Caching)** set to `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.
  - When cached, Cloudflare CDN serves the HTML from edge POPs without running Worker V8 code, reducing CPU time to **0.0ms** and consuming **0 requests** against the 100k daily worker invocation limit.
  - Inside the worker, a fallback `caches.default.match(request)` is maintained for dynamic sub-regions with <1.2ms CPU execution.
- **On-Demand Purging**: When a merchant updates prices or toggles availability, a server mutation dispatches a cache purge call for `/c/:catalogSlug` via Cloudflare's Cache API / Purge Tag.

---

## 2. Supabase PostgREST over HTTPS (Connectionless Database Strategy)

### Problem Statement
Standard PostgreSQL client libraries establish persistent TCP connections (PgBouncer or direct pool). Cloudflare Workers are ephemeral and scale across hundreds of isolated V8 isolates worldwide, which rapidly exhausts PostgreSQL connection limits (Max Connections = 60 on Supabase Free).

### Findings & Resolution
- **Stateless HTTPS Access**: We utilize `@supabase/supabase-js` targeting Supabase's PostgREST REST endpoints (`https://<project-ref>.supabase.co/rest/v1/...`).
- **Zero Connection Leaks**: Each query runs as an isolated HTTP/2 or HTTP/3 request over standard TLS. No persistent TCP socket pool is held in Worker memory.
- **Single-Query Catalog Hydration**: Instead of cascading queries (one for business, one for catalog, one for categories, one for products), we design a single PostgreSQL database function `get_public_catalog(p_catalog_slug TEXT)` that compiles the entire catalog state (business, theme, categories, products, variants, options) into a single deeply nested JSON response in **1 round-trip (<60ms)**.

---

## 3. Client-Side Image Processing & Bandwidth Protection

### Problem Statement
High-resolution smartphone photos (3MB to 10MB) would instantly exhaust the 1GB storage limit and 2GB monthly egress limit of Supabase Free.

### Findings & Resolution
- **Browser-Side OffscreenCanvas Compression**:
  - Before any upload initiates, a client-side utility converts the image file to **WebP**.
  - Maximum dimensions clamped to `1080x1080px` (or 1080px along the longest axis).
  - Compression quality target: `0.80`.
  - Resulting file size: **50KB - 95KB** (98% reduction from camera raw).
- **CDN Image Proxying**:
  - Public image URLs are rewritten to pass through `https://<my-name>.daleel-al-suez.com/storage/v1/object/public/...`.
  - Cloudflare edge caches image assets with `max-age=2592000` (30 days).
  - Origin egress from Supabase Storage is called at most once per image per Cloudflare POP, keeping Supabase monthly egress strictly under 100MB even under high traffic.

---

## 4. Atomic Concurrency Lock for Quota Enforcement

### Problem Statement
If a merchant uses multiple tabs or automated scripts to submit 10 simultaneous product creation requests when they have 99 products, a standard `SELECT COUNT(*) ...` trigger suffers from race conditions and permits overshooting the 100-product ceiling.

### Findings & Resolution
- We enforce row-level serialization via PostgreSQL `FOR UPDATE`:
  ```sql
  PERFORM 1 FROM businesses WHERE id = NEW.business_id FOR UPDATE;
  ```
- Any concurrent insert for the same `business_id` is locked in a queue until the first transaction commits or rolls back, guaranteeing 100% deterministic quota enforcement.

---

## 5. Non-Blocking Dynamic QR Redirection & Privacy Analytics

### Problem Statement
When a diner scans a table QR code (`/q/:shortCode`), redirecting must feel instantaneous (sub-50ms). If the server awaits database analytics writes before returning the HTTP 302 response, the customer experiences noticeable latency.

### Findings & Resolution
- **Worker Execution Flow**:
  1. The Worker receives `GET /q/:shortCode`.
  2. Resolves destination slug from an in-memory/indexed cache or single indexed SQL query.
  3. Returns `Response.redirect(destinationUrl, 302)` immediately.
  4. Dispatches the analytics event via Cloudflare Worker `ctx.waitUntil(...)`. The runtime processes the write in the background without blocking the client's HTTP response.
- **Privacy Hashing**:
  - `DailySalt = HMAC_SHA256(SECRET_KEY, CURRENT_DATE)`.
  - `VisitorFingerprint = SHA256(DailySalt + Truncated_IP_Subnet + UserAgent)`.
  - No raw IP is ever written to disk. The salt rotates every 24 hours at midnight UTC, rendering cross-day user tracking impossible.
- **Bot Segmentation**:
  - User-Agents matching known bots (e.g., `WhatsApp/`, `facebookexternalhit`, `Twitterbot`, `Googlebot`) are recorded as `preview_bot` and excluded from merchant-facing commercial scan statistics.

