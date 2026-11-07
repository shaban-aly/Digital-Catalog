# Quickstart & Verification Guide: Product, Variant, and Modifier Management (PRD-001)

**Feature**: `PRD-001: Product, Variant, and Modifier Management`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable scenarios to verify product creation, variant management, option groups, and the 100-product Free quota limit.

---

## Verification Scenarios

### Scenario 1: Standard Product Creation & Category Association
1. Authenticate as a store owner with an existing category.
2. Call `productService.createProduct` with:
   - `name`: `{"ar": "ساندوتش كفتة", "en": "Kofta Sandwich"}`
   - `base_price`: 55.00
   - `category_id`: `<valid-category-uuid>`
3. **Expected**: Product record created in `products` with `status = 'active'`, `base_price = 55.00`, and automatically linked to the active catalog item list.

### Scenario 2: Product with Size Variants
1. Create a product "بيتزا سوبر سوبريم" with 2 variants:
   - Variant 1: `name: {"ar": "وسط"}`, `price: 110.00`
   - Variant 2: `name: {"ar": "كبير"}`, `price: 150.00`
2. **Expected**: Two rows created in `product_variants` referencing the parent `product_id`. When calculating effective price with "كبير" selected, price evaluates to 150.00.

### Scenario 3: Option Groups & Modifier Bounds
1. Add an option group "صوصات مجانية" with:
   - `min_selections`: 1
   - `max_selections`: 2
   - Values: "طحينة" (0 EGP), "ثومية" (0 EGP), "باربكيو" (+5 EGP)
2. **Expected**: System accepts 1 or 2 selections. Attempting 0 or 3 selections is rejected by `validateOptionGroupSelections`. Selecting "باربكيو" adds +5.00 EGP to total.

### Scenario 4: Free Plan Quota Enforcement (100 Products Max)
1. Attempt to insert a 101st product for a business that already possesses 100 active products.
2. **Expected**: Rejected before insertion with an Arabic exception:
   *"تم الوصول للحد الأقصى للمنتجات في الخطة المجانية (100 منتج)."*

### Scenario 5: Deterministic Price Resolution
1. Verify the following calculation matrix:
   - Base 60.00 + Modifiers [5.00, 10.00] = 75.00 EGP.
   - Variant 80.00 (overrides Base 60.00) + Modifiers [5.00] = 85.00 EGP.
   - Catalog Override 70.00 (overrides Variant 80.00) + Modifiers [5.00] = 75.00 EGP.
2. **Expected**: Mathematically exact, rounded to 2 decimal places with zero IEEE 754 precision errors.

---

## Automated Verification Commands

```powershell
# 1. TypeScript Strict Typecheck
npx tsc --noEmit

# 2. Run All Unit Test Suites (including Product Management)
node --test tests/unit/redirect.test.ts tests/unit/auth-error-mapper.test.ts tests/unit/tenant-authorization.test.ts tests/unit/business-management.test.ts tests/unit/catalog-management.test.ts tests/unit/product-management.test.ts
```

