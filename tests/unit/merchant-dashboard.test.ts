import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DashboardBusinessSummarySchema,
  DashboardMetricCardSchema,
} from '../../src/shared/schemas.ts';
import { sanitizeRedirectUrl } from '../../src/client/utils/redirect.ts';

describe('Merchant Dashboard Workspace (MCH-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';

  describe('DashboardBusinessSummarySchema Validation', () => {
    it('accepts valid business summary with canonical URLs', () => {
      const summary = {
        id: validBusinessId,
        name: 'مطعم البركة بالسويس',
        slug: 'al-baraka',
        plan_code: 'free',
        max_products: 100,
        max_categories: 15,
        subdomainUrl: 'https://al-baraka.digitalmenu.daleel-al-suez.com/',
        catalogPreviewUrl: '/c/al-baraka',
      };
      const parsed = DashboardBusinessSummarySchema.parse(summary);
      assert.equal(parsed.name, 'مطعم البركة بالسويس');
      assert.equal(parsed.max_products, 100);
      assert.equal(parsed.subdomainUrl, 'https://al-baraka.digitalmenu.daleel-al-suez.com/');
    });

    it('rejects summary when business id is not a valid UUID', () => {
      assert.throws(
        () =>
          DashboardBusinessSummarySchema.parse({
            id: 'invalid-id',
            name: 'متجر',
            slug: 'shop',
            subdomainUrl: 'https://shop.digitalmenu.daleel-al-suez.com/',
            catalogPreviewUrl: '/c/shop',
          }),
        /معرف المتجر يجب أن يكون UUID صالح/
      );
    });

    it('rejects invalid subdomain URL format', () => {
      assert.throws(
        () =>
          DashboardBusinessSummarySchema.parse({
            id: validBusinessId,
            name: 'متجر',
            slug: 'shop',
            subdomainUrl: 'not-a-url',
            catalogPreviewUrl: '/c/shop',
          }),
        /رابط النطاق الفرعي يجب أن يكون URL صالح/
      );
    });
  });

  describe('DashboardMetricCardSchema Validation & Transparency', () => {
    it('accepts valid metric card with estimate flag', () => {
      const card = {
        labelAr: 'إجمالي المشاهدات المقدرة',
        value: 140,
        isEstimated: true,
        icon: 'Eye',
        tooltipAr: 'تقدير مبني على متوسط الزيارات لكل مسح QR',
      };
      const parsed = DashboardMetricCardSchema.parse(card);
      assert.equal(parsed.isEstimated, true);
      assert.equal(parsed.value, 140);
    });

    it('defaults isEstimated to false when omitted for direct counts', () => {
      const card = {
        labelAr: 'مرات مسح رمز QR',
        value: 95,
        icon: 'QrCode',
      };
      const parsed = DashboardMetricCardSchema.parse(card);
      assert.equal(parsed.isEstimated, false);
      assert.equal(parsed.value, 95);
    });

    it('rejects negative metric numbers', () => {
      assert.throws(() =>
        DashboardMetricCardSchema.parse({
          labelAr: 'المشاهدات',
          value: -1,
          icon: 'Eye',
        })
      );
    });
  });

  describe('Subdomain URL Formatting & Open Redirect Guard', () => {
    it('constructs canonical subdomain URL matching DOM-001 pattern', () => {
      const slug = 'suez-cafe';
      const canonicalUrl = `https://${slug}.digitalmenu.daleel-al-suez.com/`;
      assert.equal(canonicalUrl, 'https://suez-cafe.digitalmenu.daleel-al-suez.com/');
    });

    it('protects dashboard route transitions against external phishing URLs', () => {
      assert.equal(sanitizeRedirectUrl('https://evil.com', '/dashboard'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('//phishing.net', '/dashboard'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('javascript:alert(1)', '/dashboard'), '/dashboard');
      assert.equal(sanitizeRedirectUrl('/dashboard/products', '/dashboard'), '/dashboard/products');
    });
  });
});

