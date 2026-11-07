import { supabase } from '../db/supabase.ts';
import type {
  PlanCode,
  PlanTierConfig,
  PaymentChannel,
  UsageMetrics,
  UpgradeWhatsAppRequest,
} from '../../shared/types.ts';

export const PLAN_TIERS: Record<PlanCode, PlanTierConfig> = {
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
      'رابط كتالوج دائم لا يتغير',
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
  enterprise: {
    code: 'enterprise',
    nameAr: 'باقة الشركات المخصصة',
    nameEn: 'Enterprise Custom Plan',
    priceMonthlyEgp: 499,
    maxProducts: 2000,
    maxCategories: 100,
    maxImagesPerProduct: 10,
    features: [
      'منتجات وأقسام مخصصة وغير محدودة',
      'دعم متعدد الفروع والمستودعات',
      'ربط نطاق خاص مخصص Custom Domain',
      'مدير حساب خاص وتدريب فريق العمل',
    ],
  },
};

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

export class LimitsService {
  /**
   * Returns supported subscription tiers
   */
  getPlanTiers(): PlanTierConfig[] {
    return Object.values(PLAN_TIERS);
  }

  /**
   * Returns supported Egyptian payment methods (InstaPay, Vodafone Cash, Bank, Cards)
   */
  getAcceptedPaymentChannels(): PaymentChannel[] {
    return ACCEPTED_PAYMENT_CHANNELS;
  }

  /**
   * Pure in-memory calculation of capacity percentages, flags, and plan labels
   */
  calculateCapacity(params: {
    productCount: number;
    maxProducts: number;
    categoryCount: number;
    maxCategories: number;
    planCode?: PlanCode;
  }): UsageMetrics {
    const {
      productCount,
      maxProducts,
      categoryCount,
      maxCategories,
      planCode = 'free',
    } = params;

    const safeMaxProducts = Math.max(1, maxProducts);
    const safeMaxCategories = Math.max(1, maxCategories);

    const productUsagePercent = Math.min(
      100,
      Math.round((productCount / safeMaxProducts) * 100)
    );
    const categoryUsagePercent = Math.min(
      100,
      Math.round((categoryCount / safeMaxCategories) * 100)
    );

    const isProductLimitReached = productCount >= safeMaxProducts;
    const isCategoryLimitReached = categoryCount >= safeMaxCategories;

    const planConfig = PLAN_TIERS[planCode] || PLAN_TIERS.free;

    return {
      productCount,
      maxProducts: safeMaxProducts,
      productUsagePercent,
      isProductLimitReached,
      categoryCount,
      maxCategories: safeMaxCategories,
      categoryUsagePercent,
      isCategoryLimitReached,
      planCode,
      planNameAr: planConfig.nameAr,
    };
  }

  /**
   * Retrieves live metrics from the database for a merchant
   */
  async getUsageMetrics(businessId: string): Promise<UsageMetrics> {
    // 1. Fetch business limits and plan code
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('plan_code, max_products, max_categories')
      .eq('id', businessId)
      .maybeSingle();

    if (bizError || !business) {
      throw new Error(`Failed to fetch business limits: ${bizError?.message || 'Not found'}`);
    }

    // 2. Count active non-archived products
    const { count: productCount, error: prodError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .neq('status', 'archived');

    if (prodError) {
      throw new Error(`Failed to count products: ${prodError.message}`);
    }

    // 3. Count categories
    const { count: categoryCount, error: catError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (catError) {
      throw new Error(`Failed to count categories: ${catError.message}`);
    }

    return this.calculateCapacity({
      productCount: productCount ?? 0,
      maxProducts: business.max_products || 100,
      categoryCount: categoryCount ?? 0,
      maxCategories: business.max_categories || 15,
      planCode: (business.plan_code as PlanCode) || 'free',
    });
  }

  /**
   * Fast pre-check whether merchant has remaining product capacity
   */
  async canCreateProduct(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const metrics = await this.getUsageMetrics(businessId);
      if (metrics.isProductLimitReached) {
        return {
          allowed: false,
          reason: `تم الوصول للحد الأقصى للمنتجات في خطتك الحالية (${metrics.maxProducts} منتج). يرجى الترقية لإضافة المزيد.`,
        };
      }
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  /**
   * Fast pre-check whether merchant has remaining category capacity
   */
  async canCreateCategory(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const metrics = await this.getUsageMetrics(businessId);
      if (metrics.isCategoryLimitReached) {
        return {
          allowed: false,
          reason: `تم الوصول للحد الأقصى للتصنيفات في خطتك الحالية (${metrics.maxCategories} تصنيف). يرجى الترقية لإضافة المزيد.`,
        };
      }
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  /**
   * Builds pre-filled WhatsApp link with receipt verification details
   */
  generateWhatsAppUpgradeUrl(request: UpgradeWhatsAppRequest): string {
    const {
      businessId,
      businessName,
      requestedPlan,
      paymentMethod,
      whatsappNumber = '201012345678',
    } = request;

    const planName = PLAN_TIERS[requestedPlan]?.nameAr || requestedPlan;
    const channel = ACCEPTED_PAYMENT_CHANNELS.find((c) => c.id === paymentMethod);
    const paymentTitle = channel?.titleAr || paymentMethod;

    const lines = [
      'مرحباً إدارة ديجيتال منيو، أود ترقية باقة متجري:',
      `• المتجر: ${businessName}`,
      `• معرّف المتجر: ${businessId}`,
      `• الباقة المطلوبة: ${planName}`,
      `• وسيلة الدفع المستخدمة: ${paymentTitle}`,
      '• مرفق صورة إيصال التحويل لتأكيد التفعيل.',
      'شكراً لكم!',
    ];

    const encodedText = encodeURIComponent(lines.join('\n'));
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodedText}`;
  }
}

export const limitsService = new LimitsService();

