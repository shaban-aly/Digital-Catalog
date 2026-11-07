-- ============================================================================
-- Migration: 20261106190000_tenant_rls_functions_and_policies.sql
-- Domain: Tenant & Core Security (TEN-001)
-- ============================================================================

-- 1. Security Definer Helper Functions (Eliminates RLS policy recursion on business_members)
CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.business_members 
    WHERE business_id = target_business_id 
      AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.business_members 
    WHERE business_id = target_business_id 
      AND user_id = (SELECT auth.uid())
      AND role = 'owner'
  );
$$;

-- 2. Compound Performance Index for Sub-Millisecond RLS Lookups
CREATE INDEX IF NOT EXISTS idx_business_members_lookup 
  ON public.business_members (business_id, user_id, role);

CREATE INDEX IF NOT EXISTS idx_business_members_user 
  ON public.business_members (user_id);

-- 3. Enable RLS on Tenant Tables (if not already enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
    ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_members') THEN
    ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches') THEN
    ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'catalogs') THEN
    ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'qr_codes') THEN
    ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 4. Businesses Table Policies
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
CREATE POLICY "Public can view active businesses"
  ON public.businesses
  FOR SELECT
  USING (
    status = 'active' OR public.is_business_member(id)
  );

DROP POLICY IF EXISTS "Owners can update their business" ON public.businesses;
CREATE POLICY "Owners can update their business"
  ON public.businesses
  FOR UPDATE
  USING (public.is_business_owner(id))
  WITH CHECK (public.is_business_owner(id));

-- 5. Business Members Table Policies
DROP POLICY IF EXISTS "Users can view their memberships" ON public.business_members;
CREATE POLICY "Users can view their memberships"
  ON public.business_members
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR public.is_business_member(business_id)
  );

DROP POLICY IF EXISTS "Owners can manage business members" ON public.business_members;
CREATE POLICY "Owners can manage business members"
  ON public.business_members
  FOR ALL
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

