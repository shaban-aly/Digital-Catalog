# Developer Quickstart: Core Digital Catalog & QR Platform

**Feature**: `001-core-catalog-platform` | **Date**: 2026-11-05

## 1. Prerequisites
- Node.js 20+ (LTS) or 22+
- npm or pnpm
- Cloudflare Wrangler CLI (`npm i -g wrangler`)
- Supabase account (Free project) or Supabase CLI for local database simulation

---

## 2. Environment Configuration
Create a `.env` file in the project root:

```ini
# Supabase Configuration (Free Tier)
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Primary Domain Base (Do not include trailing slash)
VITE_PUBLIC_APP_URL=https://<my-name>.daleel-al-suez.com

# Analytics Fingerprint Secret (64-character random hex string)
ANALYTICS_HMAC_SECRET=c8f59b207d1a...
```

---

## 3. Database Initialization
1. Log in to your Supabase Project dashboard.
2. Open the **SQL Editor**.
3. Copy and run the complete DDL script from:  
   `specs/001-core-catalog-platform/contracts/database-schema.sql`
4. Create a public storage bucket named `product-images`:
   - Set bucket visibility to **Public**.
   - Allowed MIME types: `image/webp`, `image/jpeg`, `image/png`.
   - Max file size: `200KB` (enforced on upload).

---

## 4. Local Development Workflow

### Start Local Vite Development Server (HMR enabled)
```bash
npm run dev
```
The application will launch on `http://localhost:3000` (or the configured Vite port).

### Test Cloudflare Worker Emulation Locally
To verify Cloudflare Workers SSR, headers, and Edge Cache emulation:
```bash
npx wrangler dev
```
Wrangler will boot the local Miniflare worker sandbox matching the production Cloudflare V8 environment.

---

## 5. Key Local Verification URLs
- **Homepage**: `http://localhost:3000/`
- **Merchant Login**: `http://localhost:3000/auth/login`
- **Merchant Dashboard**: `http://localhost:3000/dashboard`
- **Public Catalog (SSR)**: `http://localhost:3000/c/sample-store`
- **Dynamic QR 302 Redirect**: `http://localhost:3000/q/test1`
- **Dynamic Sitemap**: `http://localhost:3000/sitemap.xml`
- **Robots Directives**: `http://localhost:3000/robots.txt`

