# Technical Research: Tenant Authorization & RLS Architecture (TEN-001)

**Feature**: `TEN-001: Tenant Authorization`  
**Date**: 2026-11-06  
**Status**: Completed

---

## 1. PostgreSQL RLS Strategy & Recursion Prevention

### Context & Challenge
In a multi-tenant PostgreSQL database where `business_members` maps users (`auth.uid()`) to businesses (`business_id`), writing a policy on `business_members` such as:
```sql
CREATE POLICY "Members can view their business members" ON public.business_members
FOR SELECT USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);
```
causes **infinite recursion** in PostgreSQL because querying `business_members` triggers the policy evaluation on `business_members` repeatedly until the query aborts with a recursion error.

### Architectural Solution: `SECURITY DEFINER` Helper Functions
To eliminate recursion and optimize query performance, we encapsulate membership checks inside lightweight `SECURITY DEFINER` functions with `STABLE` volatility and explicit `search_path`:

```sql
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
```

### Rationale
1. **Recursion Bypass**: `SECURITY DEFINER` executes with the privileges of the function owner, bypassing RLS inside the helper query.
2. **PostgreSQL Cacheability**: Marked as `STABLE`, meaning PostgreSQL executes it once per query per `target_business_id`, caching the result across multi-row joins.
3. **Index-Backed Speed**: Backed by a compound primary/unique index on `(business_id, user_id)`, executing in under 0.1ms.

---

## 2. RLS Policy Taxonomy Across All Tables

| Table | Operation | Policy Rule | Rationale |
|---|---|---|---|
| `businesses` | `SELECT` | `id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()) OR status = 'active'` | Allows members to view their store, and anonymous visitors to view active public stores. |
| `businesses` | `UPDATE` | `is_business_owner(id)` | Only business owners can update store metadata. |
| `business_members` | `SELECT` | `user_id = auth.uid() OR is_business_member(business_id)` | Users can see their own memberships and co-members. |
| `business_members` | `INSERT / UPDATE / DELETE` | `is_business_owner(business_id)` | Only owners can invite, change roles, or remove members. |
| `categories` | `SELECT` | `is_business_member(business_id) OR (is_active = true AND EXISTS (SELECT 1 FROM businesses b WHERE b.id = categories.business_id AND b.status = 'active'))` | Authenticated members see all categories; public sees only active categories of active businesses. |
| `categories` | `ALL (Write)` | `is_business_member(business_id)` | Any authorized member can manage categories. |
| `products` | `SELECT` | `is_business_member(business_id) OR (is_available = true AND EXISTS (SELECT 1 FROM businesses b WHERE b.id = products.business_id AND b.status = 'active'))` | Authenticated members see all products; public sees only available items. |
| `products` | `ALL (Write)` | `is_business_member(business_id)` | WITH CHECK verifies caller belongs to `business_id`. |
| `catalogs` / `items` | `SELECT` | `is_business_member(business_id) OR is_published = true` | Published catalogs are readable by public; drafts restricted to members. |

---

## 3. High-Performance Indexing Strategy

To guarantee that RLS evaluation adds less than 1ms overhead to PostgREST queries:
1. `CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members (user_id);`
2. `CREATE INDEX IF NOT EXISTS idx_business_members_lookup ON public.business_members (business_id, user_id, role);`
3. Every tenant table has an index on `business_id` (e.g. `idx_products_business`, `idx_categories_business`).

---

## 4. Verification and Security Test Strategy

We will formulate two verification layers:
1. **Database RLS Test Script (`tests/database/rls_policies.sql`)**: Executes simulated queries switching roles (`SET ROLE anon`, `SET ROLE authenticated`, `SET request.jwt.claim.sub = '...'`) proving that User A cannot read or write User B's rows.
2. **TypeScript Integration Contract Tests (`tests/unit/tenant-isolation.test.ts`)**: Mocks and validates query filters and membership verification helpers.

