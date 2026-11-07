# Technical Research: Product, Variant, and Modifier Management (PRD-001)

**Feature**: `PRD-001: Product, Variant, and Modifier Management`  
**Date**: 2026-11-06  
**Status**: Completed

---

## 1. Deterministic Price Hierarchy Resolution

### The Challenge
A digital catalog item can have several layers of pricing:
1. Master Product `base_price` (e.g. 100 EGP)
2. Product Variant `price` (e.g. Size Large: 140 EGP)
3. Selected Option Group Modifiers `price_delta` (e.g. Extra Cheese: +15 EGP, Mushrooms: +10 EGP)
4. Presentation Catalog `price_override` (from `CAT-001`, e.g. Special Event Menu: 125 EGP)

### Resolution Algorithm
The effective total item price is computed deterministically following this strict precedence order:
$$\text{Base Item Price} = \begin{cases} \text{Catalog Override} & \text{if catalog item override is specified} \\ \text{Variant Price} & \text{if a variant is selected} \\ \text{Product Base Price} & \text{otherwise} \end{cases}$$

$$\text{Final Line Item Price} = \text{Base Item Price} + \sum_{i=1}^{k} \text{Modifier Price Delta}_i$$

- All price calculations use decimal arithmetic (`Math.round((sum + Number.EPSILON) * 100) / 100`) to completely eliminate floating-point precision artifacts (e.g., preventing `0.1 + 0.2 = 0.30000000000000004`).

---

## 2. Free Tier Quota Enforcement (100 Active Products)

### Policy & Execution (Constitution Principle II)
Each business on the `free` tier is strictly entitled to at most 100 active products.

### Dual-Layer Enforcement Pattern
1. **Application-Level Pre-Flight Check**:
   Before executing the multi-table insert in `ProductService.createProduct`, a fast `head: true` query counts existing non-archived products:
   ```typescript
   const { count, error } = await supabase
     .from('products')
     .select('*', { count: 'exact', head: true })
     .eq('business_id', businessId)
     .neq('status', 'archived');

   if ((count ?? 0) >= 100) {
     throw new Error('تم الوصول للحد الأقصى للمنتجات في الخطة المجانية (100 منتج). يرجى ترقية باقتك لإضافة المزيد.');
   }
   ```
2. **PostgreSQL Trigger Guard**:
   An atomic database trigger (`check_product_quota_before_insert`) provides an unbreakable guarantee against race conditions during concurrent requests.

---

## 3. Option Group Selection Boundaries & Validation Rules

### Configuration Matrix
Option groups govern how customers customize their orders:
- **Required Single-Select** (e.g., Bread Type, Meat Doneness):
  - `is_required: true`, `min_selections: 1`, `max_selections: 1`
- **Optional Single-Select** (e.g., Dressing):
  - `is_required: false`, `min_selections: 0`, `max_selections: 1`
- **Optional Multi-Select** (e.g., Extra Toppings):
  - `is_required: false`, `min_selections: 0`, `max_selections: 5`
- **Mandatory Multi-Select** (e.g., Pick 3 Appetizers):
  - `is_required: true`, `min_selections: 3`, `max_selections: 3`

### Selection Validator (TypeScript)
```typescript
export function validateOptionGroupSelections(
  group: { min_selections: number; max_selections: number; is_required: boolean },
  selectedValuesCount: number
): { valid: boolean; error?: string } {
  if (group.is_required && selectedValuesCount < Math.max(1, group.min_selections)) {
    return { valid: false, error: 'يرجى اختيار الخيارات المطلوبة' };
  }
  if (selectedValuesCount < group.min_selections) {
    return { valid: false, error: `يجب اختيار ${group.min_selections} خيارات على الأقل` };
  }
  if (selectedValuesCount > group.max_selections) {
    return { valid: false, error: `الحد الأقصى للاختيارات هو ${group.max_selections}` };
  }
  return { valid: true };
}
```

---

## 4. Multi-Tenant Cascade Strategy & Data Integrity

- `products` cascade deletes to:
  - `product_variants` (`ON DELETE CASCADE`)
  - `product_option_groups` (`ON DELETE CASCADE`) $\rightarrow$ cascades to `product_option_values` (`ON DELETE CASCADE`)
  - `product_media` (`ON DELETE CASCADE`)
  - `catalog_items` (`ON DELETE CASCADE`)
- `categories(id)` uses `ON DELETE RESTRICT` on `products.category_id`:
  - A category cannot be deleted while master products remain assigned to it.

