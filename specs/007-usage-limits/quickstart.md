# Quickstart & Verification Guide: Entitlements and Usage Limits (LMT-001)

**Feature**: `LMT-001: Entitlements and Usage Limits`  
**Date**: 2026-11-06  
**Status**: Ready for Verification

This guide outlines runnable scenarios to verify quota metrics calculation, limit reached detection, Egyptian payment channel configurations, and WhatsApp manual upgrade link generation.

---

## Verification Scenarios

### Scenario 1: Live Quota Capacity Metrics Calculation
1. For a merchant with 25 products out of 100 max, and 3 categories out of 15 max.
2. Call `limitsService.calculateCapacity({ productCount: 25, maxProducts: 100, categoryCount: 3, maxCategories: 15, planCode: 'free' })`.
3. **Expected**:
   - `productUsagePercent`: 25%
   - `categoryUsagePercent`: 20%
   - `isProductLimitReached`: false
   - `isCategoryLimitReached`: false
   - `planNameAr`: "الباقة المجانية الأساسية"

### Scenario 2: Limit Reached Detection (100% Capacity)
1. For a merchant with 100 products out of 100 max.
2. Call `limitsService.calculateCapacity({ productCount: 100, maxProducts: 100, categoryCount: 5, maxCategories: 15, planCode: 'free' })`.
3. **Expected**:
   - `productUsagePercent`: 100%
   - `isProductLimitReached`: true
   - "Add Product" button is disabled in UI with an upgrade prompt.

### Scenario 3: Egyptian Payment Channels Catalog
1. Call `limitsService.getAcceptedPaymentChannels()`.
2. **Expected**: Returns 4 payment channels:
   - InstaPay (إنستاباي)
   - Vodafone Cash (فودافون كاش والمحافظ الذكية)
   - Bank Transfer (تحويل بنكي مباشر)
   - Cards (فيزا وماستركارد) with badge "قريباً الدفع التلقائي"

### Scenario 4: WhatsApp Manual Upgrade Link Generation
1. Call `limitsService.generateWhatsAppUpgradeUrl({ businessId: '<uuid>', businessName: 'مطعم المصري', requestedPlan: 'pro', paymentMethod: 'instapay', whatsappNumber: '201012345678' })`.
2. **Expected**: Returns a valid `https://wa.me/201012345678?text=...` URL with encoded Arabic text containing the store name, plan code, and payment method.

---

## Automated Verification Commands

```powershell
# 1. TypeScript Strict Typecheck
npx tsc --noEmit

# 2. Run All Unit Test Suites (including Limits & Subscriptions)
node --test tests/unit/redirect.test.ts tests/unit/auth-error-mapper.test.ts tests/unit/tenant-authorization.test.ts tests/unit/business-management.test.ts tests/unit/catalog-management.test.ts tests/unit/product-management.test.ts tests/unit/media-management.test.ts tests/unit/usage-limits.test.ts
```

