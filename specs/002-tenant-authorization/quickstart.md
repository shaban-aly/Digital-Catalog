# Quickstart & Verification Guide: Tenant Authorization (TEN-001)

**Feature**: `TEN-001: Tenant Authorization & Data Isolation`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable scenarios to prove that PostgreSQL Row Level Security (RLS) guarantees 100% data isolation between merchants and blocks unauthorized access.

---

## Prerequisites

- Active Supabase PostgreSQL database connection.
- Two test merchant identities:
  - **Merchant A**: `merchant-a@example.com` (Owner of Business A: `UUID-A`)
  - **Merchant B**: `merchant-b@example.com` (Owner of Business B: `UUID-B`)

---

## Verification Scenarios

### Scenario 1: Cross-Tenant Read Isolation (SELECT)
1. Authenticate as Merchant A (`SET request.jwt.claim.sub = '<merchant-a-uuid>'`).
2. Execute:
   ```sql
   SELECT * FROM public.products WHERE business_id = '<business-b-uuid>';
   ```
3. **Expected Result**: Returns `0 rows`. PostgreSQL RLS filters out all records belonging to Business B.

### Scenario 2: Cross-Tenant Write Isolation (UPDATE / DELETE)
1. Authenticate as Merchant A.
2. Attempt to update a product belonging to Business B:
   ```sql
   UPDATE public.products 
   SET price = 0 
   WHERE id = '<product-b-uuid>' AND business_id = '<business-b-uuid>';
   ```
3. **Expected Result**: `UPDATE 0`. Zero rows affected.

### Scenario 3: Cross-Tenant Injection via Payload Tampering (INSERT)
1. Authenticate as Merchant A.
2. Attempt to insert a product into Business B's catalog:
   ```sql
   INSERT INTO public.products (business_id, name, base_price) 
   VALUES ('<business-b-uuid>', '{"ar": "منتج مزيف"}', 100);
   ```
3. **Expected Result**: Fails with `ERROR: new row violates row-level security policy for table "products"`.

### Scenario 4: Anonymous Public Read Access
1. Switch to anonymous role: `SET ROLE anon;`.
2. Query active published products:
   ```sql
   SELECT id, name, base_price FROM public.products WHERE is_available = true;
   ```
3. **Expected Result**: Successfully returns active products belonging to active businesses.

### Scenario 5: Anonymous Write Universal Block
1. As anonymous role (`SET ROLE anon;`), attempt to insert:
   ```sql
   INSERT INTO public.categories (business_id, name) VALUES ('<business-a-uuid>', '{"ar": "قسم"}');
   ```
2. **Expected Result**: Fails with `ERROR: new row violates row-level security policy`.

---

## Automated Verification Commands

```powershell
# 1. Verify TypeScript types
npx tsc --noEmit

# 2. Run unit tests
node --test tests/unit/redirect.test.ts tests/unit/auth-error-mapper.test.ts
```

