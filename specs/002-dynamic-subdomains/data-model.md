# Database Schema Design: Multi-Tenant Dynamic Subdomains

**Feature**: `002-dynamic-subdomains` | **Date**: 2026-11-06 | **Status**: Complete & Ready for Plan Review

---

## 1. Existing Schema Analysis

The current database schema (defined in `001-core-catalog-platform`) includes:
- `businesses.slug`: `TEXT NOT NULL UNIQUE`
- `catalogs.slug`: `TEXT NOT NULL` with `UNIQUE(business_id, slug)`

### Identified Gaps:
1. **Case-Insensitive Uniqueness**: `UNIQUE(slug)` in PostgreSQL is case-sensitive by default with standard collation. A unique index on `LOWER(slug)` is required to prevent DNS collisions (e.g. `AhmedCafe` vs `ahmedcafe`).
2. **DNS Syntax Verification**: Slugs must be guaranteed to be valid DNS hostnames under RFC 1123.
3. **Tenant Lifecycle State**: `businesses` has `plan_code` but lacks a dedicated `status` column to indicate whether the merchant is active, suspended, or archived.
4. **Reserved Subdomains Protection**: No database constraint currently prevents a merchant from registering `tools`, `www`, `admin`, `api`, or `digitalmenu`.

---

## 2. Proposed Schema Modifications

### 2.1 Table: `businesses` (Modifications)

```sql
-- 1. Tenant Lifecycle Status Type
CREATE TYPE public.business_status AS ENUM ('active', 'suspended', 'archived');

-- 2. Add Status column to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status public.business_status NOT NULL DEFAULT 'active';

-- 3. Enforce Case-Insensitive Uniqueness
DROP INDEX IF EXISTS public.idx_businesses_slug_unique;
CREATE UNIQUE INDEX idx_businesses_slug_lower_unique ON public.businesses (LOWER(slug));

-- 4. Enforce RFC 1123 DNS Subdomain Format
-- Rules: 3-63 chars, lowercase a-z, 0-9, single hyphens, no leading/trailing hyphens, no double hyphens
ALTER TABLE public.businesses
  ADD CONSTRAINT chk_business_slug_dns_format CHECK (
    slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
    AND slug !~ '--'
    AND length(slug) >= 3
    AND length(slug) <= 63
  );
```

---

### 2.2 Table: `reserved_slugs` (New Entity)

A dedicated, immutable table holding all reserved, protected, and system subdomains that can NEVER be registered by any tenant.

```sql
CREATE TABLE IF NOT EXISTS public.reserved_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'system', -- 'system', 'infrastructure', 'security', 'future_use'
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant lowercase lookups
CREATE UNIQUE INDEX idx_reserved_slugs_lower ON public.reserved_slugs (LOWER(slug));

-- Initial Reserved Slugs Seed
INSERT INTO public.reserved_slugs (slug, category, reason) VALUES
  -- Existing Infrastructure & Vercel Applications
  ('daleel-al-suez', 'infrastructure', 'Apex domain name representation'),
  ('www', 'infrastructure', 'Main website Vercel production alias'),
  ('tools', 'infrastructure', 'Independent tools application hosted on Vercel'),
  ('digitalmenu', 'infrastructure', 'Digital Catalog main platform Worker custom domain'),
  
  -- Core Platform System & Security
  ('admin', 'security', 'Future central administrative console'),
  ('api', 'security', 'Future centralized API gateway'),
  ('app', 'security', 'Generic platform application prefix'),
  ('auth', 'security', 'Authentication endpoints'),
  ('login', 'security', 'Login portal shortcut'),
  ('register', 'security', 'Registration portal shortcut'),
  ('dashboard', 'security', 'Merchant dashboard shortcut'),
  ('account', 'security', 'Account management'),
  ('billing', 'security', 'Subscription and payment gateway'),
  ('support', 'security', 'Customer support desk'),
  ('help', 'security', 'Knowledge base and documentation'),
  ('docs', 'security', 'API and developer documentation'),
  ('status', 'security', 'Platform status page'),
  
  -- Internet Standards & Protocols
  ('mail', 'system', 'Mail server MX / webmail'),
  ('webmail', 'system', 'Webmail access'),
  ('email', 'system', 'Email infrastructure'),
  ('smtp', 'system', 'SMTP gateway'),
  ('imap', 'system', 'IMAP gateway'),
  ('pop', 'system', 'POP3 gateway'),
  ('ftp', 'system', 'FTP service'),
  ('cpanel', 'system', 'Control panel access'),
  ('whm', 'system', 'Web host manager'),
  ('autodiscover', 'system', 'Microsoft Exchange autodiscover'),
  ('autoconfig', 'system', 'Mozilla Thunderbird autoconfig'),
  ('ns1', 'system', 'Nameserver 1'),
  ('ns2', 'system', 'Nameserver 2'),
  ('dns', 'system', 'DNS management'),
  
  -- Environment & Staging Keywords
  ('dev', 'future_use', 'Development staging environment'),
  ('staging', 'future_use', 'Staging preview environment'),
  ('test', 'future_use', 'Testing environment'),
  ('demo', 'future_use', 'Interactive platform demo'),
  ('cdn', 'future_use', 'Content delivery network'),
  ('static', 'future_use', 'Static asset host'),
  ('assets', 'future_use', 'Asset host binding'),
  ('media', 'future_use', 'Media storage proxy');
```

---

### 2.3 Table: `tenant_slug_redirects` (Future Slug Migrations)

Tracks previous slugs when a merchant is permitted to rename their business slug, ensuring previous printed QR codes and shared links do not break.

```sql
CREATE TABLE IF NOT EXISTS public.tenant_slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL UNIQUE,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_slug_redirects_old_slug ON public.tenant_slug_redirects (LOWER(old_slug));
```

---

### 2.4 Stored Procedures & Validation Functions

```sql
-- 1. Validation function to check if a slug is available
CREATE OR REPLACE FUNCTION public.is_slug_available(p_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  v_normalized := LOWER(TRIM(p_slug));

  -- Check DNS format
  IF v_normalized !~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$' OR v_normalized ~ '--' OR length(v_normalized) < 3 OR length(v_normalized) > 63 THEN
    RETURN FALSE;
  END IF;

  -- Check Reserved Slugs
  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE LOWER(slug) = v_normalized) THEN
    RETURN FALSE;
  END IF;

  -- Check Existing Businesses
  IF EXISTS (SELECT 1 FROM public.businesses WHERE LOWER(slug) = v_normalized) THEN
    RETURN FALSE;
  END IF;

  -- Check Historical Redirects
  IF EXISTS (SELECT 1 FROM public.tenant_slug_redirects WHERE LOWER(old_slug) = v_normalized) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 2. Enhanced create_merchant_business RPC with RFC 1123 & Reserved validation
CREATE OR REPLACE FUNCTION public.create_merchant_business(
  p_name TEXT,
  p_slug TEXT,
  p_industry_type TEXT DEFAULT 'restaurant',
  p_currency_code TEXT DEFAULT 'EGP',
  p_phone_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clean_slug TEXT;
  v_business RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_clean_slug := LOWER(TRIM(p_slug));

  -- Validate Slug Availability
  IF NOT public.is_slug_available(v_clean_slug) THEN
    RAISE EXCEPTION 'Slug "%" is invalid, reserved, or already taken', v_clean_slug;
  END IF;

  -- 1. Create Business
  INSERT INTO public.businesses (
    name, slug, industry_type, currency_code, phone_number, plan_code, status, max_products, max_categories
  ) VALUES (
    p_name, v_clean_slug, p_industry_type, p_currency_code, p_phone_number, 'free', 'active', 100, 15
  ) RETURNING * INTO v_business;

  -- 2. Link User as Owner
  INSERT INTO public.business_members (
    business_id, user_id, role
  ) VALUES (
    v_business.id, v_user_id, 'owner'
  );

  -- 3. Create Default Branch
  INSERT INTO public.branches (
    business_id, name, is_default
  ) VALUES (
    v_business.id, 'الفرع الرئيسي', true
  );

  -- 4. Create Primary Catalog
  INSERT INTO public.catalogs (
    business_id, name, slug, is_published, theme_config
  ) VALUES (
    v_business.id, 'قائمة المتجر الرئيسية', v_clean_slug, true, jsonb_build_object('preset', p_industry_type)
  );

  RETURN to_jsonb(v_business);
END;
$$;
```

---

## 3. RLS & Public Access Constraints

1. **`reserved_slugs`**:
   - `SELECT`: Granted to `anon` and `authenticated` (needed for live client-side validation in registration forms).
   - `INSERT / UPDATE / DELETE`: Denied to all public roles. Restricted strictly to migrations or internal superadmin.
2. **`businesses`**:
   - `SELECT`: Public `anon` role can select only `id, name, slug, currency_code, phone_number, logo_url, cover_url, industry_type, status` WHERE `status = 'active'`.
   - `INSERT`: Restricted to `authenticated` users via the `create_merchant_business` RPC procedure.
   - `UPDATE`: Restricted to `business_members` with role `'owner'`. Slug modification requires re-validation against `is_slug_available`.

