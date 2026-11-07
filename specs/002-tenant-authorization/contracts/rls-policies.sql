-- ============================================================================
-- TENANT AUTHORIZATION & ROW LEVEL SECURITY CONTRACT (TEN-001)
-- ============================================================================

-- 1. Helper Functions (Security Definer to prevent policy recursion)
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

-- 2. Enable RLS on core tenant tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- 3. Business Policies
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

-- 4. Business Members Policies
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

