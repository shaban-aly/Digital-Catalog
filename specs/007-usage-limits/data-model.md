# Data Model: Entitlements and Usage Limits (LMT-001)

**Feature**: `LMT-001: Entitlements and Usage Limits`  
**Date**: 2026-11-06  
**Status**: Completed

---

## 1. Domain Entities & Static Configurations

### Plan Tiers Definition
```typescript
export interface PlanTierConfig {
  code: 'free' | 'pro' | 'enterprise';
  nameAr: string;
  nameEn: string;
  priceMonthlyEgp: number;
  maxProducts: number;
  maxCategories: number;
  maxImagesPerProduct: number;
  features: string[];
  isPopular?: boolean;
}

export const PLAN_TIERS: Record<string, PlanTierConfig> = {
  free: {
    code: 'free',
    nameAr: 'الباقة المجانية الأساسية',
    nameEn: 'Free Starter Plan',
    priceMonthlyEgp: 0,
    maxProducts: 100,
    maxCategories: 15,
    maxImagesPerProduct: 3,
    features: [
      'حتى 100 منتج نشط',
      'حتى 15 قسماً وتصنيفاً',
      'رابط نطاق فرعي مجاني مدى الحياة',
      'منيو رقمي سريع متوافق مع الموبايل',
      'باركود QR ديناميكي',
      'طلب عبر واتساب مباشر',
    ],
  },
  pro: {
    code: 'pro',
    nameAr: 'الباقة الاحترافية',
    nameEn: 'Pro Merchant Plan',
    priceMonthlyEgp: 199,
    maxProducts: 500,
    maxCategories: 30,
    maxImagesPerProduct: 5,
    isPopular: true,
    features: [
      'حتى 500 منتج نشط',
      'حتى 30 قسماً وتصنيفاً',
      'إحصائيات زيارات متقدمة',
      'إزالة علامة المنصة المائية',
      'أولوية في الدعم الفني عبر واتساب',
    ],
  },
};
```

---

### Egyptian Payment Channels
```typescript
export interface PaymentChannel {
  id: string;
  type: 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'card_gateway';
  titleAr: string;
  titleEn: string;
  details: string;
  accountHolder?: string;
  isAutomated: boolean;
  badgeAr?: string;
}

export const ACCEPTED_PAYMENT_CHANNELS: PaymentChannel[] = [
  {
    id: 'instapay',
    type: 'instapay',
    titleAr: 'إنستاباي (InstaPay)',
    titleEn: 'InstaPay Instant Transfer',
    details: '01012345678 أو عبر المعرف: digitalmenu@instapay',
    accountHolder: 'منصة ديجيتال منيو - دليل السويس',
    isAutomated: false,
    badgeAr: 'تحويل فوري بدون رسوم',
  },
  {
    id: 'vodafone_cash',
    type: 'vodafone_cash',
    titleAr: 'فودافون كاش والمحافظ الذكية',
    titleEn: 'Vodafone Cash & Mobile Wallets',
    details: '01012345678',
    accountHolder: 'محفظة معتمدة',
    isAutomated: false,
    badgeAr: 'تحويل لحظي',
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    titleAr: 'تحويل بنكي مباشر (CIB / NBE)',
    titleEn: 'Direct Bank Wire',
    details: 'البنك التجاري الدولي (CIB) - رقم الحساب: 100012345678',
    accountHolder: 'شركة دليل السويس للحلول الرقمية',
    isAutomated: false,
  },
  {
    id: 'card_gateway',
    type: 'card_gateway',
    titleAr: 'بطاقات فيزا وماستركارد وميزة',
    titleEn: 'Credit / Debit Cards',
    details: 'بوابات الدفع الإلكترونية المعتمدة',
    isAutomated: true,
    badgeAr: 'قريباً الدفع التلقائي',
  },
];
```

---

## 2. Validation Schemas (Zod 4 Compliant)

```typescript
import { z } from 'zod';

export const UsageMetricsSchema = z.object({
  productCount: z.number().int().nonnegative(),
  maxProducts: z.number().int().positive(),
  productUsagePercent: z.number().min(0).max(100),
  isProductLimitReached: z.boolean(),
  categoryCount: z.number().int().nonnegative(),
  maxCategories: z.number().int().positive(),
  categoryUsagePercent: z.number().min(0).max(100),
  isCategoryLimitReached: z.boolean(),
  planCode: z.enum(['free', 'pro', 'enterprise']),
  planNameAr: z.string(),
});
export type UsageMetrics = z.infer<typeof UsageMetricsSchema>;

export const UpgradeWhatsAppRequestSchema = z.object({
  businessId: z.string().uuid('معرف المتجر غير صالح'),
  businessName: z.string().min(1, 'اسم المتجر مطلوب'),
  requestedPlan: z.enum(['pro', 'enterprise']),
  paymentMethod: z.enum(['instapay', 'vodafone_cash', 'bank_transfer']),
  whatsappNumber: z.string().default('201012345678'),
});
export type UpgradeWhatsAppRequest = z.infer<typeof UpgradeWhatsAppRequestSchema>;
```

