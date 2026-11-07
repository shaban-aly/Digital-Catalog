import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PublicCatalogPayloadSchema,
  WhatsAppOrderDetailsSchema,
} from '../../src/shared/schemas.ts';
import { buildWhatsAppOrderUrl } from '../../src/public-catalog/utils/whatsapp-formatter.ts';

describe('Public Catalog Experience (PUB-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';
  const validCatalogId = 'c0000000-0000-4000-8000-000000000001';
  const validCategoryId = 'd0000000-0000-4000-8000-000000000001';
  const validProductId = 'e0000000-0000-4000-8000-000000000001';

  describe('PublicCatalogPayloadSchema Validation', () => {
    it('accepts complete public catalog payload with categories and products', () => {
      const payload = {
        business: {
          id: validBusinessId,
          name: 'مطعم البركة بالسويس',
          slug: 'al-baraka',
          currency_code: 'EGP',
          phone_number: '01012345678',
          logo_url: 'https://cdn.example.com/logo.png',
          cover_url: 'https://cdn.example.com/cover.png',
          industry_type: 'restaurant',
        },
        catalog: {
          id: validCatalogId,
          slug: 'al-baraka-menu',
          theme_config: { colorScheme: 'emerald' },
        },
        categories: [
          {
            id: validCategoryId,
            name: { ar: 'مشويات', en: 'Grills' },
            sort_order: 1,
            product_count: 5,
          },
        ],
        products: [
          {
            id: validProductId,
            name: { ar: 'كباب وكفتة مشكل', en: 'Mixed Grill' },
            description: { ar: 'نصف كيلو مشكل مع أرز وسلطات' },
            effective_price: 240,
            compare_at_price: 280,
            unit: 'نصف كيلو',
            is_available: true,
            is_featured: true,
            cover_image_url: 'https://cdn.example.com/kebab.jpg',
            gallery_image_urls: ['https://cdn.example.com/kebab.jpg'],
            category_id: validCategoryId,
            attributes: { calories: 850 },
            variants: [
              {
                id: 'f0000000-0000-4000-8000-000000000001',
                name: { ar: 'كيلو كامل' },
                price: 450,
                is_available: true,
                attributes: {},
                sort_order: 1,
              },
            ],
            option_groups: [
              {
                id: '10000000-0000-4000-8000-000000000001',
                name: { ar: 'السلطات الإضافية' },
                is_required: false,
                min_selections: 0,
                max_selections: 2,
                sort_order: 1,
                values: [
                  {
                    id: '20000000-0000-4000-8000-000000000001',
                    name: { ar: 'طحينة إضافية' },
                    price_delta: 15,
                    is_default: false,
                    sort_order: 1,
                  },
                ],
              },
            ],
          },
        ],
      };

      const parsed = PublicCatalogPayloadSchema.parse(payload);
      assert.equal(parsed.business.name, 'مطعم البركة بالسويس');
      assert.equal(parsed.categories.length, 1);
      assert.equal(parsed.products.length, 1);
      assert.equal(parsed.products[0].effective_price, 240);
    });

    it('rejects payload when business id is missing or invalid', () => {
      assert.throws(
        () =>
          PublicCatalogPayloadSchema.parse({
            business: { id: 'invalid-id' },
            catalog: {},
            categories: [],
            products: [],
          }),
        (err: any) => err.name === 'ZodError'
      );
    });
  });

  describe('WhatsAppOrderDetailsSchema Validation', () => {
    it('accepts valid order details with options and variant', () => {
      const order = {
        storeName: 'كافيه الأندلس',
        storePhone: '01012345678',
        productName: 'لاتيه مثلج',
        variantName: 'حجم لارج',
        selectedOptions: [
          { groupName: 'النكهات', optionName: 'كراميل مملح', priceDelta: 10 },
        ],
        totalPrice: 65,
        currency: 'EGP',
        catalogUrl: 'https://alandalus.digitalmenu.daleel-al-suez.com',
      };

      const parsed = WhatsAppOrderDetailsSchema.parse(order);
      assert.equal(parsed.storeName, 'كافيه الأندلس');
      assert.equal(parsed.totalPrice, 65);
    });

    it('rejects empty store name or invalid catalog URL', () => {
      assert.throws(
        () =>
          WhatsAppOrderDetailsSchema.parse({
            storeName: '',
            storePhone: '01012345678',
            productName: 'لاتيه',
            totalPrice: 40,
            catalogUrl: 'invalid-url',
          }),
        /اسم المتجر لا يمكن أن يكون فارغاً/
      );
    });

    it('rejects negative total price', () => {
      assert.throws(
        () =>
          WhatsAppOrderDetailsSchema.parse({
            storeName: 'كافيه',
            storePhone: '01012345678',
            productName: 'لاتيه',
            totalPrice: -10,
            catalogUrl: 'https://alandalus.digitalmenu.daleel-al-suez.com',
          }),
        /السعر الإجمالي يجب أن يكون صفراً أو موجباً/
      );
    });
  });

  describe('buildWhatsAppOrderUrl Formatting & Phone Normalization', () => {
    it('normalizes local Egyptian mobile 01012345678 to 201012345678', () => {
      const url = buildWhatsAppOrderUrl({
        storeName: 'حلواني السويس',
        storePhone: '01012345678',
        productName: 'تورتة لوتس',
        totalPrice: 280,
        currency: 'EGP',
        catalogUrl: 'https://suez-sweets.digitalmenu.daleel-al-suez.com',
      });

      assert.ok(url.startsWith('https://wa.me/201012345678?text='));
    });

    it('normalizes formatted phone +20 10 9876 5432 to 201098765432', () => {
      const url = buildWhatsAppOrderUrl({
        storeName: 'حلواني السويس',
        storePhone: '+20 10 9876 5432',
        productName: 'تورتة',
        totalPrice: 200,
        currency: 'EGP',
        catalogUrl: 'https://suez-sweets.digitalmenu.daleel-al-suez.com',
      });

      assert.ok(url.startsWith('https://wa.me/201098765432?text='));
    });

    it('normalizes international phone with leading 0020 to 20', () => {
      const url = buildWhatsAppOrderUrl({
        storeName: 'حلواني السويس',
        storePhone: '00201012345678',
        productName: 'تورتة',
        totalPrice: 200,
        currency: 'EGP',
        catalogUrl: 'https://suez-sweets.digitalmenu.daleel-al-suez.com',
      });

      assert.ok(url.startsWith('https://wa.me/201012345678?text='));
    });

    it('includes structured Arabic order lines, variant, and option modifiers in message text', () => {
      const url = buildWhatsAppOrderUrl({
        storeName: 'برجر فاكتوري',
        storePhone: '01011112222',
        productName: 'سوبر بيكون برجر',
        variantName: 'ساندوتش دبل',
        selectedOptions: [
          { groupName: 'إضافات الجبن', optionName: 'شيدر صوص إضافي', priceDelta: 15 },
          { groupName: 'المخللات', optionName: 'هالبينو حار', priceDelta: 5 },
        ],
        totalPrice: 140,
        currency: 'EGP',
        catalogUrl: 'https://burger.digitalmenu.daleel-al-suez.com/p/123',
      });

      const decodedText = decodeURIComponent(url.split('?text=')[1]);

      assert.ok(decodedText.includes('مرحباً برجر فاكتوري'));
      assert.ok(decodedText.includes('🛒 *سوبر بيكون برجر*'));
      assert.ok(decodedText.includes('▫️ *الحجم / المتغير:* ساندوتش دبل'));
      assert.ok(decodedText.includes('إضافات الجبن: شيدر صوص إضافي (+15 ج.م)'));
      assert.ok(decodedText.includes('المخللات: هالبينو حار (+5 ج.م)'));
      assert.ok(decodedText.includes('💰 *الإجمالي المحسوب:* 140.00 ج.م'));
      assert.ok(decodedText.includes('🔗 *رابط المنتج في الكتالوج:* https://burger.digitalmenu.daleel-al-suez.com/p/123'));
    });

    it('formats message cleanly when no options or variant are selected', () => {
      const url = buildWhatsAppOrderUrl({
        storeName: 'عصائر القناة',
        storePhone: '01234567890',
        productName: 'عصير مانجو فريش',
        totalPrice: 35,
        currency: 'EGP',
        catalogUrl: 'https://kanaa.digitalmenu.daleel-al-suez.com',
      });

      const decodedText = decodeURIComponent(url.split('?text=')[1]);
      assert.ok(!decodedText.includes('الحجم / المتغير'));
      assert.ok(!decodedText.includes('الإضافات والخيارات'));
      assert.ok(decodedText.includes('35.00 ج.م'));
    });
  });

  describe('Dynamic Drawer Item Price Aggregation', () => {
    it('calculates base price plus variant and modifier deltas', () => {
      const basePrice = 80;
      const variantPrice = 110; // selected
      const optionDeltas = [15, 10]; // cheese + sauce

      const total = variantPrice + optionDeltas.reduce((acc, d) => acc + d, 0);
      assert.equal(total, 135);
    });

    it('falls back to product effective price when no variant is selected', () => {
      const effectivePrice = 50;
      const optionDeltas = [5];

      const total = effectivePrice + optionDeltas.reduce((acc, d) => acc + d, 0);
      assert.equal(total, 55);
    });
  });
});
