-- Migration: 20261106161000_tenant_slug_validation_functions.sql
-- Feature: 002-dynamic-subdomains
-- Domain: Tenant (Business & Tenant Management)
-- Description: Creates is_slug_available() validation function and replaces
--              create_merchant_business() RPC with an enhanced version that
--              enforces RFC 1123 format, reserved slug, and existing tenant checks.
-- Depends on: 20261106160000_tenant_status_and_dns_constraints.sql
--             20261106160500_tenant_reserved_slugs_registry.sql

-- ============================================================
-- Step 1: Create is_slug_available() - callable by anon/authenticated for
--         real-time registration form validation
-- ============================================================
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

  -- Validate DNS format (RFC 1123 label rules)
  IF v_normalized !~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
     OR v_normalized ~ '--'
     OR length(v_normalized) < 3
     OR length(v_normalized) > 63
  THEN
    RETURN FALSE;
  END IF;

  -- Check Reserved Slugs registry
  IF EXISTS (SELECT 1 FROM public.reserved_slugs WHERE LOWER(slug) = v_normalized) THEN
    RETURN FALSE;
  END IF;

  -- Check Existing Businesses (case-insensitive)
  IF EXISTS (SELECT 1 FROM public.businesses WHERE LOWER(slug) = v_normalized) THEN
    RETURN FALSE;
  END IF;

  -- Check Historical Slug Redirects (from table created in next migration)
  -- This check is conditional on the table existing to allow independent migration ordering.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_slug_redirects'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.tenant_slug_redirects WHERE LOWER(old_slug) = v_normalized) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.is_slug_available(TEXT) IS 'Returns TRUE if the given slug is valid, not reserved, and not taken by any existing business or historical redirect. Safe to call from client-side registration forms.';

-- Grant execute to anon and authenticated for client-side validation
GRANT EXECUTE ON FUNCTION public.is_slug_available(TEXT) TO anon, authenticated;

-- ============================================================
-- Step 2: Replace create_merchant_business() with enhanced version
--         that includes slug validation and tenant status
-- ============================================================
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
  -- Authentication guard
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Normalize slug
  v_clean_slug := LOWER(TRIM(p_slug));

  -- Validate slug availability (format + reserved + existing tenants)
  IF NOT public.is_slug_available(v_clean_slug) THEN
    RAISE EXCEPTION 'Slug "%" is invalid, reserved, or already taken', v_clean_slug
      USING ERRCODE = 'unique_violation';
  END IF;

  -- 1. Create Business (with status 'active' and correct currency for Egypt)
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

  -- 4. Create Primary Catalog (auto-published for new merchants)
  INSERT INTO public.catalogs (
    business_id, name, slug, is_published, theme_config
  ) VALUES (
    v_business.id,
    'قائمة المتجر الرئيسية',
    v_clean_slug,
    true,
    jsonb_build_object('preset', p_industry_type)
  );

  RETURN to_jsonb(v_business);
END;
$$;

COMMENT ON FUNCTION public.create_merchant_business(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Atomic RPC to create a new merchant business with owner membership, default branch, and primary catalog. Enforces slug availability, DNS format, and reserved slug constraints.';

-- ============================================================
-- Rollback Reference (DO NOT RUN IN PRODUCTION WITHOUT REVIEW)
-- ============================================================
-- REVOKE EXECUTE ON FUNCTION public.is_slug_available(TEXT) FROM anon, authenticated;
-- DROP FUNCTION IF EXISTS public.is_slug_available(TEXT);
-- Note: create_merchant_business was replaced (not newly created) — rollback by restoring the previous version.
