-- Migration: 20261106161500_tenant_slug_redirects.sql
-- Feature: 002-dynamic-subdomains
-- Domain: Tenant (Business & Tenant Management)
-- Description: Creates the tenant_slug_redirects table for tracking historical slug
--              changes so that old QR codes and printed URLs continue to work via
--              301 permanent redirects.
-- Depends on: 20261106160000_tenant_status_and_dns_constraints.sql

-- ============================================================
-- Step 1: Create the tenant_slug_redirects table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL UNIQUE,
  new_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tenant_slug_redirects IS 'Tracks historical slug changes for a business so old subdomains and QR codes redirect to the current slug.';
COMMENT ON COLUMN public.tenant_slug_redirects.old_slug IS 'The previously used slug that should be permanently redirected (301) to new_slug.';
COMMENT ON COLUMN public.tenant_slug_redirects.new_slug IS 'The current active slug for this business at the time of this redirect record.';

-- ============================================================
-- Step 2: Index on LOWER(old_slug) for fast edge-resolver lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenant_slug_redirects_old_slug
  ON public.tenant_slug_redirects (LOWER(old_slug));

CREATE INDEX IF NOT EXISTS idx_tenant_slug_redirects_business_id
  ON public.tenant_slug_redirects (business_id);

-- ============================================================
-- Step 3: Enable Row Level Security
-- ============================================================
ALTER TABLE public.tenant_slug_redirects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 4: RLS Policies
-- ============================================================

-- Public SELECT: anon and authenticated can read redirects (needed for edge resolver lookups)
CREATE POLICY "tenant_slug_redirects_public_select"
  ON public.tenant_slug_redirects
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: Restricted to business owners only
CREATE POLICY "tenant_slug_redirects_owner_insert"
  ON public.tenant_slug_redirects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = tenant_slug_redirects.business_id
        AND bm.user_id = auth.uid()
        AND bm.role = 'owner'
    )
  );

-- UPDATE / DELETE: Restricted to service_role (migration/admin operations only)
-- No public UPDATE or DELETE policies = blocked for all public roles.

-- ============================================================
-- Rollback Reference (DO NOT RUN IN PRODUCTION WITHOUT REVIEW)
-- ============================================================
-- DROP TABLE IF EXISTS public.tenant_slug_redirects;
