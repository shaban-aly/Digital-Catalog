# Quickstart & Verification Guide: Catalog & Category Management (CAT-001)

**Feature**: `CAT-001: Catalog and Category Management`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable scenarios to verify category creation, 15-category limit enforcement, catalog item placement, and presentation price overrides.

---

## Verification Scenarios

### Scenario 1: Category Creation & Bilingual Support
1. Authenticate as a store owner.
2. Call `categoryService.createCategory` with:
   - Arabic name: "مشويات"
   - English name: "Grills"
   - `sort_order`: 1
   - `is_active`: true
3. **Expected**: Record created in `categories` table with valid `id`, `name = {"ar": "مشويات", "en": "Grills"}`, and `business_id` set to active tenant.

### Scenario 2: Free Plan Quota Enforcement (15 Categories Max)
1. Attempt to create a 16th category for a business that already has 15 categories.
2. **Expected**: Operation is rejected before insert with an Arabic exception:
   *"تم الوصول للحد الأقصى للتصنيفات في الخطة المجانية (15 تصنيفاً)."*

### Scenario 3: Category Visibility Toggling
1. Update an existing category with `is_active = false`.
2. **Expected**: Category persists in database with `is_active = false`. Public storefront queries filtering on `is_active = true` immediately exclude this category.

### Scenario 4: Curated Catalog Item Placement & Price Override
1. Link an existing product to a catalog and category via `catalog_items`.
2. Set `price_override = 85.00` while master product `base_price = 100.00`.
3. Set `is_featured = true`.
4. **Expected**: Catalog query returns effective price of 85.00 with featured flag active, while master product row remains 100.00.

### Scenario 5: Protected Deletion Constraint
1. Attempt to delete a category that still has associated products.
2. **Expected**: Foreign key RESTRICT constraint rejects deletion, ensuring zero orphan catalog items or broken product links.

---

## Automated Verification Commands

```powershell
# 1. TypeScript Strict Typecheck
npx tsc --noEmit

# 2. Run All Unit Test Suites (including Catalog Management)
node --test tests/unit/redirect.test.ts tests/unit/auth-error-mapper.test.ts tests/unit/tenant-authorization.test.ts tests/unit/business-management.test.ts tests/unit/catalog-management.test.ts
```

