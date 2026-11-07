-- ============================================================================
-- DIGITAL CATALOG & QR PLATFORM: CORE DATABASE SCHEMA
-- Target Database: PostgreSQL 15+ / Supabase PostgreSQL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESSES (TENANTS)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry_type TEXT NOT NULL DEFAULT 'restaurant',
  currency_code VARCHAR(3) NOT NULL DEFAULT 'EGP',
  phone_number TEXT,
  logo_url TEXT,
  cover_url TEXT,
  plan_code TEXT NOT NULL DEFAULT 'free',
  max_products INT NOT NULL DEFAULT 100,
  max_categories INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BUSINESS MEMBERS (RBAC)
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- references auth.users(id)
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- 3. BRANCHES (1 Default Branch in MVP)
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'الفرع الرئيسي',
  is_default BOOLEAN NOT NULL DEFAULT true,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. MASTER CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name JSONB NOT NULL, -- { "ar": "...", "en": "..." }
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_business ON public.categories (business_id, sort_order);

-- 5. MASTER PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name JSONB NOT NULL,
  description JSONB,
  base_price NUMERIC(12, 2),
  compare_at_price NUMERIC(12, 2),
  barcode TEXT,
  sku TEXT,
  unit TEXT DEFAULT 'piece',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'out_of_stock', 'archived')),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_business_status ON public.products (business_id, status);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (business_id, barcode) WHERE barcode IS NOT NULL;

-- 6. PRODUCT VARIANTS (SIZES / COLORS)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  sku TEXT,
  barcode TEXT,
  price NUMERIC(12, 2) NOT NULL,
  compare_at_price NUMERIC(12, 2),
  is_available BOOLEAN NOT NULL DEFAULT true,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants (product_id, sort_order);

-- 7. PRODUCT OPTION GROUPS (MODIFIERS)
CREATE TABLE IF NOT EXISTS public.product_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_selections INT NOT NULL DEFAULT 0,
  max_selections INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_option_groups_product ON public.product_option_groups (product_id, sort_order);

-- 8. PRODUCT OPTION VALUES
CREATE TABLE IF NOT EXISTS public.product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  price_delta NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_option_values_group ON public.product_option_values (group_id, sort_order);

-- 9. PRODUCT MEDIA (IMAGES)
CREATE TABLE IF NOT EXISTS public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size_bytes INT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_product ON public.product_media (product_id, sort_order);

-- 10. CATALOGS
CREATE TABLE IF NOT EXISTS public.catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, slug)
);

-- 11. CATALOG ITEMS (CURATED PLACEMENT)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  price_override NUMERIC(12, 2),
  sort_order INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(catalog_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_catalog_items_catalog ON public.catalog_items (catalog_id, sort_order);

-- 12. DYNAMIC QR CODES
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  catalog_id UUID NOT NULL REFERENCES public.catalogs(id) ON DELETE CASCADE,
  short_code VARCHAR(16) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_scans BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON public.qr_codes (short_code);

-- 13. QR ANALYTICS EVENTS (EPHEMERAL 30-DAY RETENTION)
CREATE TABLE IF NOT EXISTS public.qr_scan_events (
  id BIGSERIAL PRIMARY KEY,
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fingerprint_hash CHAR(64) NOT NULL, -- Daily rotating salted HMAC-SHA256 (Never raw IP)
  is_bot BOOLEAN NOT NULL DEFAULT false,
  referrer TEXT
);
CREATE INDEX IF NOT EXISTS idx_qr_events_code_date ON public.qr_scan_events (qr_code_id, scanned_at);

-- 14. ATOMIC QUOTA ENFORCEMENT TRIGGER (POSTGRESQL)
CREATE OR REPLACE FUNCTION public.enforce_product_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INT;
  v_max_limit INT;
BEGIN
  -- Row-level exclusive lock to prevent concurrency race conditions
  SELECT max_products INTO v_max_limit
  FROM public.businesses
  WHERE id = NEW.business_id
  FOR UPDATE;

  SELECT COUNT(*) INTO v_current_count
  FROM public.products
  WHERE business_id = NEW.business_id
    AND status != 'archived';

  IF v_current_count >= v_max_limit THEN
    RAISE EXCEPTION 'Product quota exceeded: Maximum % products permitted on current plan.', v_max_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_product_quota ON public.products;
CREATE TRIGGER trg_enforce_product_quota
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.enforce_product_quota();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scan_events ENABLE ROW LEVEL SECURITY;

-- Helper function: Returns active user's business IDs
CREATE OR REPLACE FUNCTION public.get_auth_business_ids()
RETURNS SETOF UUID AS $$
  SELECT business_id FROM public.business_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Business Members Access Policy
CREATE POLICY "Users view own business memberships"
  ON public.business_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own business membership"
  ON public.business_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Merchant members manage business members"
  ON public.business_members FOR ALL
  USING (business_id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Authenticated users can create businesses"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Merchant members view business profile"
  ON public.businesses FOR SELECT
  USING (id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members update business profile"
  ON public.businesses FOR UPDATE
  USING (id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members delete business profile"
  ON public.businesses FOR DELETE
  USING (id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members manage branches"
  ON public.branches FOR ALL
  USING (business_id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members manage categories"
  ON public.categories FOR ALL
  USING (business_id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members manage products"
  ON public.products FOR ALL
  USING (business_id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members manage variants"
  ON public.product_variants FOR ALL
  USING (product_id IN (SELECT id FROM public.products WHERE business_id IN (SELECT public.get_auth_business_ids())));

CREATE POLICY "Merchant members manage option groups"
  ON public.product_option_groups FOR ALL
  USING (product_id IN (SELECT id FROM public.products WHERE business_id IN (SELECT public.get_auth_business_ids())));

CREATE POLICY "Merchant members manage option values"
  ON public.product_option_values FOR ALL
  USING (group_id IN (
    SELECT pog.id FROM public.product_option_groups pog
    JOIN public.products p ON p.id = pog.product_id
    WHERE p.business_id IN (SELECT public.get_auth_business_ids())
  ));

CREATE POLICY "Merchant members manage media"
  ON public.product_media FOR ALL
  USING (product_id IN (SELECT id FROM public.products WHERE business_id IN (SELECT public.get_auth_business_ids())));

CREATE POLICY "Merchant members manage catalogs"
  ON public.catalogs FOR ALL
  USING (business_id IN (SELECT public.get_auth_business_ids()));

CREATE POLICY "Merchant members manage catalog items"
  ON public.catalog_items FOR ALL
  USING (catalog_id IN (SELECT id FROM public.catalogs WHERE business_id IN (SELECT public.get_auth_business_ids())));

CREATE POLICY "Merchant members manage QR codes"
  ON public.qr_codes FOR ALL
  USING (business_id IN (SELECT public.get_auth_business_ids()));

-- Public Read Policies (Zero Auth Required)
CREATE POLICY "Public can view published catalogs"
  ON public.catalogs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can view business info for published catalogs"
  ON public.businesses FOR SELECT
  USING (id IN (SELECT business_id FROM public.catalogs WHERE is_published = true));

CREATE POLICY "Public can view categories of published catalogs"
  ON public.categories FOR SELECT
  USING (is_active = true AND business_id IN (SELECT business_id FROM public.catalogs WHERE is_published = true));

CREATE POLICY "Public can view catalog items of published catalogs"
  ON public.catalog_items FOR SELECT
  USING (is_available = true AND catalog_id IN (SELECT id FROM public.catalogs WHERE is_published = true));

CREATE POLICY "Public can view products in published catalogs"
  ON public.products FOR SELECT
  USING (status = 'active' AND id IN (
    SELECT product_id FROM public.catalog_items ci
    JOIN public.catalogs c ON c.id = ci.catalog_id
    WHERE c.is_published = true AND ci.is_available = true
  ));

CREATE POLICY "Public can view variants of public products"
  ON public.product_variants FOR SELECT
  USING (is_available = true AND product_id IN (
    SELECT id FROM public.products WHERE status = 'active'
  ));

CREATE POLICY "Public can view option groups of public products"
  ON public.product_option_groups FOR SELECT
  USING (product_id IN (SELECT id FROM public.products WHERE status = 'active'));

CREATE POLICY "Public can view option values of public option groups"
  ON public.product_option_values FOR SELECT
  USING (group_id IN (
    SELECT pog.id FROM public.product_option_groups pog
    JOIN public.products p ON p.id = pog.product_id
    WHERE p.status = 'active'
  ));

CREATE POLICY "Public can view media of public products"
  ON public.product_media FOR SELECT
  USING (product_id IN (SELECT id FROM public.products WHERE status = 'active'));

CREATE POLICY "Public can resolve active QR codes"
  ON public.qr_codes FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- ATOMIC MERCHANT INITIALIZATION RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_merchant_business(
  p_name TEXT,
  p_slug TEXT,
  p_industry_type TEXT DEFAULT 'restaurant',
  p_currency_code TEXT DEFAULT 'SAR',
  p_phone_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_business RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Create Business Profile
  INSERT INTO public.businesses (
    name, slug, industry_type, currency_code, phone_number, plan_code, max_products, max_categories
  ) VALUES (
    p_name, p_slug, p_industry_type, p_currency_code, p_phone_number, 'free', 100, 15
  ) RETURNING * INTO v_business;

  -- 2. Link User as Business Owner
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
    v_business.id, 'قائمة المتجر الرئيسية', p_slug, true, jsonb_build_object('preset', p_industry_type)
  );

  RETURN to_jsonb(v_business);
END;
$$;

