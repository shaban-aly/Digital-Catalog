# Quickstart & Verification Guide: Business & Store Management (BIZ-001)

**Feature**: `BIZ-001: Business and Store Management`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable scenarios to verify store creation, real-time slug validation, and business profile maintenance.

---

## Verification Scenarios

### Scenario 1: Real-Time DNS-Safe Slug Validation
1. Open the merchant registration screen `/auth/register`.
2. Test the following slug inputs and verify expected real-time feedback:
   - `sh` -> **Rejected**: *"الرابط قصير جداً (3 أحرف على الأقل)"*
   - `my--store` -> **Rejected**: *"لا يمكن استخدام شرطتين متتاليتين في الرابط"*
   - `admin` -> **Rejected**: *"هذا الرابط محجوز أو مستخدم بالفعل"*
   - `shawarma-alex` -> **Accepted**: *"الرابط متاح للحجز!"* (Green badge)

### Scenario 2: Store Creation & Atomic Provisioning
1. Register a new merchant account with store name "برجر كورنر" and slug "burger-corner".
2. Submit the form.
3. Verify database outcome:
   - Row exists in `businesses` with `name = 'برجر كورنر'`, `slug = 'burger-corner'`, `plan_code = 'free'`.
   - Row exists in `business_members` with `role = 'owner'` linking the user ID.
   - Row exists in `branches` with `name = 'الفرع الرئيسي'` and `is_default = true`.
   - Row exists in `catalogs` with matching slug and `is_published = true`.

### Scenario 3: Duplicate Slug Rejection
1. Attempt to register a second merchant with the identical slug `burger-corner`.
2. **Expected**: System marks the slug as unavailable and prevents submission. If forced, database unique constraint on `businesses(slug)` rejects the insert.

### Scenario 4: Store Profile Maintenance (Settings Update)
1. Log into the merchant dashboard as the store owner.
2. Navigate to Store Settings, update the store phone number to `+201001234567`, and click Save.
3. Verify that the updated phone number is saved in `businesses` and immediately formats WhatsApp ordering links on the public catalog.

---

## Automated Verification Commands

```powershell
# 1. TypeScript Strict Typecheck
npx tsc --noEmit

# 2. Run All Unit Test Suites
node --test tests/unit/redirect.test.ts tests/unit/auth-error-mapper.test.ts tests/unit/tenant-authorization.test.ts tests/unit/business-management.test.ts
```

