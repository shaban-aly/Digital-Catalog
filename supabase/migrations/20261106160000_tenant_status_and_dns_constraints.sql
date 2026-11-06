-- Migration: 20261106160000_tenant_status_and_dns_constraints.sql
-- Feature: 002-dynamic-subdomains
-- Domain: Tenant (Business & Tenant Management)
-- Description: Adds tenant lifecycle status enum and column to businesses table,
--              enforces case-insensitive unique index on slug, and adds RFC 1123
--              DNS hostname format check constraint.
--
-- IMPORTANT: Before applying, verify existing slugs satisfy the DNS constraint:
--   SELECT slug FROM public.businesses WHERE NOT (
--     slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
--     AND slug !~ '--'
--     AND length(slug) >= 3
--     AND length(slug) <= 63
--   );
-- If any rows are returned, manually fix them before running this migration.
-- Backfill existing slugs to lowercase first:
--   UPDATE public.businesses SET slug = LOWER(slug) WHERE slug <> LOWER(slug);

-- ============================================================
-- Step 1: Create the business_status enum type
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.business_status AS ENUM ('active', 'suspended', 'archived');
  END IF;
END $$;

-- ============================================================
-- Step 2: Backfill existing slugs to lowercase (safe, idempotent)
-- ============================================================
UPDATE public.businesses
SET slug = LOWER(slug)
WHERE slug <> LOWER(slug);

-- ============================================================
-- Step 3: Add the status column to businesses
-- ============================================================
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status public.business_status NOT NULL DEFAULT 'active';

-- ============================================================
-- Step 4: Enforce Case-Insensitive Uniqueness on slug
-- (Drop any previous non-lowercase unique index first)
-- ============================================================
DROP INDEX IF EXISTS public.idx_businesses_slug_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug_lower_unique
  ON public.businesses (LOWER(slug));

-- ============================================================
-- Step 5: Enforce RFC 1123 DNS Subdomain Format
-- Rules: 3-63 chars, lowercase a-z/0-9, single hyphens,
--        no leading/trailing hyphens, no consecutive hyphens
-- ============================================================
ALTER TABLE public.businesses
  DROP CONSTRAINT IF EXISTS chk_business_slug_dns_format;

ALTER TABLE public.businesses
  ADD CONSTRAINT chk_business_slug_dns_format CHECK (
    slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
    AND slug !~ '--'
    AND length(slug) >= 3
    AND length(slug) <= 63
  );

-- ============================================================
-- Rollback Reference (DO NOT RUN IN PRODUCTION WITHOUT REVIEW)
-- ============================================================
-- ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS chk_business_slug_dns_format;
-- DROP INDEX IF EXISTS idx_businesses_slug_lower_unique;
-- ALTER TABLE public.businesses DROP COLUMN IF EXISTS status;
-- DROP TYPE IF EXISTS public.business_status;
