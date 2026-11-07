import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UsageMetricsSchema,
  UpgradeWhatsAppRequestSchema,
} from '../../src/shared/schemas.ts';
import { limitsService } from '../../src/server/services/limits.ts';

describe('Entitlements and Usage Limits (LMT-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';

  describe('UsageMetricsSchema Validation', () => {
    it('accepts valid usage metrics payload', () => {
      const valid = {
        productCount: 25,
        maxProducts: 100,
        productUsagePercent: 25,
        isProductLimitReached: false,
        categoryCount: 5,
        maxCategories: 15,
        categoryUsagePercent: 33,
        isCategoryLimitReached: false,
        planCode: 'free' as const,
        planNameAr: 'الباقة المجانية الأساسية',
      };
      const parsed = UsageMetricsSchema.safeParse(valid);
      assert.equal(parsed.success, true);
    });

    it('rejects usage percent exceeding 100', () => {
      const invalid = {
        productCount: 110,
        maxProducts: 100,
        productUsagePercent: 110,
        isProductLimitReached: true,
        categoryCount: 5,
        maxCategories: 15,
        categoryUsagePercent: 33,
        isCategoryLimitReached: false,
        planCode: 'free' as const,
        planNameAr: 'الباقة المجانية الأساسية',
      };
      const parsed = UsageMetricsSchema.safeParse(invalid);
      assert.equal(parsed.success, false);
    });
  });

  describe('UpgradeWhatsAppRequestSchema Validation', () => {
    it('accepts valid upgrade request payload', () => {
      const valid = {
        businessId: validBusinessId,
        businessName: 'مطعم البركة',
        requestedPlan: 'pro' as const,
        paymentMethod: 'instapay' as const,
      };
      const parsed = UpgradeWhatsAppRequestSchema.safeParse(valid);
      assert.equal(parsed.success, true);
    });

    it('rejects invalid businessId UUID', () => {
      const invalid = {
        businessId: 'not-a-uuid',
        businessName: 'متجر',
        requestedPlan: 'pro' as const,
        paymentMethod: 'vodafone_cash' as const,
      };
      assert.equal(UpgradeWhatsAppRequestSchema.safeParse(invalid).success, false);
    });
  });

  describe('Capacity Calculation (calculateCapacity)', () => {
    it('computes exact usage percentages and flags for partial usage', () => {
      const metrics = limitsService.calculateCapacity({
        productCount: 20,
        maxProducts: 100,
        categoryCount: 3,
        maxCategories: 15,
        planCode: 'free',
      });

      assert.equal(metrics.productCount, 20);
      assert.equal(metrics.productUsagePercent, 20);
      assert.equal(metrics.isProductLimitReached, false);
      assert.equal(metrics.categoryCount, 3);
      assert.equal(metrics.categoryUsagePercent, 20);
      assert.equal(metrics.isCategoryLimitReached, false);
      assert.equal(metrics.planNameAr, 'الباقة المجانية الأساسية');
    });

    it('triggers isProductLimitReached when productCount reaches maxProducts', () => {
      const atLimit = limitsService.calculateCapacity({
        productCount: 100,
        maxProducts: 100,
        categoryCount: 5,
        maxCategories: 15,
        planCode: 'free',
      });

      assert.equal(atLimit.productUsagePercent, 100);
      assert.equal(atLimit.isProductLimitReached, true);
    });

    it('clamps usage percent at 100 if count exceeds limit', () => {
      const overLimit = limitsService.calculateCapacity({
        productCount: 105,
        maxProducts: 100,
        categoryCount: 16,
        maxCategories: 15,
        planCode: 'free',
      });

      assert.equal(overLimit.productUsagePercent, 100);
      assert.equal(overLimit.isProductLimitReached, true);
      assert.equal(overLimit.categoryUsagePercent, 100);
      assert.equal(overLimit.isCategoryLimitReached, true);
    });

    it('resolves correct Arabic plan names for all tiers', () => {
      const free = limitsService.calculateCapacity({ productCount: 0, maxProducts: 100, categoryCount: 0, maxCategories: 15, planCode: 'free' });
      const pro = limitsService.calculateCapacity({ productCount: 0, maxProducts: 500, categoryCount: 0, maxCategories: 30, planCode: 'pro' });

      assert.equal(free.planNameAr, 'الباقة المجانية الأساسية');
      assert.equal(pro.planNameAr, 'الباقة الاحترافية');
    });
  });

  describe('Egyptian Payment Channels Catalog', () => {
    it('returns all 4 local payment channels', () => {
      const channels = limitsService.getAcceptedPaymentChannels();
      assert.equal(channels.length, 4);

      const types = channels.map((c) => c.type);
      assert.equal(types.includes('instapay'), true);
      assert.equal(types.includes('vodafone_cash'), true);
      assert.equal(types.includes('bank_transfer'), true);
      assert.equal(types.includes('card_gateway'), true);
    });

    it('marks cards gateway with Coming Soon badge', () => {
      const channels = limitsService.getAcceptedPaymentChannels();
      const cardChannel = channels.find((c) => c.type === 'card_gateway');
      assert.ok(cardChannel);
      assert.match(cardChannel?.badgeAr || '', /قريباً/);
    });
  });

  describe('Subscription Plan Tiers', () => {
    it('returns Free and Pro plan tiers with correct quotas', () => {
      const tiers = limitsService.getPlanTiers();
      const free = tiers.find((t) => t.code === 'free');
      const pro = tiers.find((t) => t.code === 'pro');

      assert.ok(free);
      assert.equal(free?.priceMonthlyEgp, 0);
      assert.equal(free?.maxProducts, 100);
      assert.equal(free?.maxCategories, 15);

      assert.ok(pro);
      assert.equal(pro?.priceMonthlyEgp, 199);
      assert.equal(pro?.maxProducts, 500);
      assert.equal(pro?.maxCategories, 30);
    });
  });

  describe('WhatsApp Manual Upgrade URL Generation', () => {
    it('generates a valid WhatsApp URL with encoded Arabic request details', () => {
      const url = limitsService.generateWhatsAppUpgradeUrl({
        businessId: validBusinessId,
        businessName: 'كافيه المصري',
        requestedPlan: 'pro',
        paymentMethod: 'instapay',
        whatsappNumber: '201012345678',
      });

      assert.match(url, /^https:\/\/wa\.me\/201012345678\?text=/);
      const decodedText = decodeURIComponent(url);
      assert.equal(decodedText.includes('كافيه المصري'), true);
      assert.equal(decodedText.includes('الباقة الاحترافية'), true);
      assert.equal(decodedText.includes('إنستاباي'), true);
      assert.equal(decodedText.includes(validBusinessId), true);
    });
  });
});

