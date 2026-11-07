import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CartItemSchema,
  CustomerCartSchema,
  MultiItemOrderSubmissionSchema,
} from '../../src/shared/schemas.ts';
import {
  buildMultiItemWhatsAppOrderUrl,
  normalizeEgyptianPhone,
} from '../../src/public-catalog/utils/whatsapp-cart-formatter.ts';
import {
  getCartStorageKey,
  generateCartItemId,
  isCartExpired,
  syncCartItems,
  CART_EXPIRATION_TTL_MS,
} from '../../src/public-catalog/hooks/use-cart.ts';

describe('WhatsApp Cart & Multi-Item Ordering (COM-001)', () => {
  const validProductId = '123e4567-e89b-12d3-a456-426614174000';
  const validVariantId = 'c0000000-0000-4000-8000-000000000001';

  describe('CartItemSchema Validation', () => {
    it('accepts valid cart item with quantity and line total', () => {
      const item = {
        id: `${validProductId}_base_`,
        productId: validProductId,
        productName: 'برجر دبل بيكون',
        unitPrice: 130,
        quantity: 2,
        lineTotal: 260,
        isAvailable: true,
        priceChanged: false,
      };
      const parsed = CartItemSchema.parse(item);
      assert.equal(parsed.productName, 'برجر دبل بيكون');
      assert.equal(parsed.quantity, 2);
      assert.equal(parsed.lineTotal, 260);
      assert.equal(parsed.isAvailable, true);
    });

    it('rejects invalid productId UUID', () => {
      assert.throws(
        () =>
          CartItemSchema.parse({
            id: 'item_1',
            productId: 'not-a-uuid',
            productName: 'برجر',
            unitPrice: 100,
            quantity: 1,
            lineTotal: 100,
          }),
        /معرف المنتج يجب أن يكون UUID صالح/
      );
    });

    it('rejects zero or negative quantity', () => {
      assert.throws(
        () =>
          CartItemSchema.parse({
            id: 'item_1',
            productId: validProductId,
            productName: 'برجر',
            unitPrice: 100,
            quantity: 0,
            lineTotal: 0,
          }),
        /الكمية يجب أن تكون 1 على الأقل/
      );
    });

    it('rejects negative unit price', () => {
      assert.throws(
        () =>
          CartItemSchema.parse({
            id: 'item_1',
            productId: validProductId,
            productName: 'برجر',
            unitPrice: -50,
            quantity: 1,
            lineTotal: -50,
          }),
        /سعر الوحدة لا يمكن أن يكون سالباً/
      );
    });
  });

  describe('CustomerCartSchema Validation', () => {
    it('accepts valid customer cart with 24-hour timestamp and orderSubmitted flag', () => {
      const cart = {
        storeSlug: 'al-baraka',
        storeName: 'مطعم البركة',
        storePhone: '01012345678',
        currency: 'EGP',
        items: [
          {
            id: `${validProductId}_base_`,
            productId: validProductId,
            productName: 'برجر',
            unitPrice: 120,
            quantity: 1,
            lineTotal: 120,
          },
        ],
        customerName: 'أحمد محمود',
        fulfillmentNotes: 'طاولة 3',
        totalAmount: 120,
        totalQuantity: 1,
        updatedAt: new Date().toISOString(),
        orderSubmitted: true,
      };

      const parsed = CustomerCartSchema.parse(cart);
      assert.equal(parsed.storeSlug, 'al-baraka');
      assert.equal(parsed.orderSubmitted, true);
      assert.equal(parsed.items.length, 1);
    });
  });

  describe('MultiItemOrderSubmissionSchema Validation', () => {
    it('accepts complete multi-item order submission with optional fields omitted', () => {
      const submission = {
        storeName: 'مطعم البركة بالسويس',
        storePhone: '01012345678',
        items: [
          {
            id: `${validProductId}_base_`,
            productId: validProductId,
            productName: 'ساندوتش كباب',
            unitPrice: 110,
            quantity: 2,
            lineTotal: 220,
          },
        ],
        totalAmount: 220,
        currency: 'EGP',
        catalogUrl: 'https://al-baraka.digitalmenu.daleel-al-suez.com/',
      };
      const parsed = MultiItemOrderSubmissionSchema.parse(submission);
      assert.equal(parsed.storeName, 'مطعم البركة بالسويس');
      assert.equal(parsed.items.length, 1);
      assert.equal(parsed.totalAmount, 220);
      assert.equal(parsed.customerName, undefined);
      assert.equal(parsed.fulfillmentNotes, undefined);
    });

    it('rejects order when items array is empty', () => {
      assert.throws(
        () =>
          MultiItemOrderSubmissionSchema.parse({
            storeName: 'مطعم',
            storePhone: '01012345678',
            items: [],
            totalAmount: 0,
            catalogUrl: 'https://al-baraka.digitalmenu.daleel-al-suez.com/',
          }),
        /السلة فارغة/
      );
    });
  });

  describe('normalizeEgyptianPhone & WhatsApp URL Generation', () => {
    it('normalizes local 11-digit mobile starting with 01 to 201xxxxxxxxx', () => {
      assert.equal(normalizeEgyptianPhone('01012345678'), '201012345678');
      assert.equal(normalizeEgyptianPhone('01123456789'), '201123456789');
      assert.equal(normalizeEgyptianPhone('01223456789'), '201223456789');
      assert.equal(normalizeEgyptianPhone('01523456789'), '201523456789');
    });

    it('strips non-digits and handles 0020 prefix', () => {
      assert.equal(normalizeEgyptianPhone('+20 10 1234 5678'), '201012345678');
      assert.equal(normalizeEgyptianPhone('00201012345678'), '201012345678');
    });

    it('builds valid WhatsApp URL targeting normalized international phone', () => {
      const url = buildMultiItemWhatsAppOrderUrl({
        storeName: 'مشويات السويس',
        storePhone: '01012345678',
        items: [
          {
            id: 'item_1',
            productId: validProductId,
            productName: 'كباب مشكل',
            unitPrice: 200,
            quantity: 1,
            lineTotal: 200,
          },
        ],
        totalAmount: 200,
        currency: 'EGP',
        catalogUrl: 'https://grill.digitalmenu.daleel-al-suez.com/',
      });

      assert.ok(url.startsWith('https://wa.me/201012345678?text='));
    });

    it('formats multiple items with variants, option modifiers, and item notes', () => {
      const url = buildMultiItemWhatsAppOrderUrl({
        storeName: 'برجر سويس',
        storePhone: '01122334455',
        customerName: 'إبراهيم علي',
        fulfillmentNotes: 'طاولة رقم 4',
        items: [
          {
            id: 'item_1',
            productId: validProductId,
            productName: 'سوبر برجر',
            variantName: 'حجم لارج',
            unitPrice: 125,
            quantity: 2,
            lineTotal: 250,
            selectedOptions: [
              { groupId: 'g1', groupName: 'إضافات', valueId: 'v1', optionName: 'جبنة شيدر', priceDelta: 15 },
            ],
            itemNote: 'بدون بصل',
          },
          {
            id: 'item_2',
            productId: validProductId,
            productName: 'بطاطس مقلية',
            unitPrice: 35,
            quantity: 1,
            lineTotal: 35,
          },
        ],
        totalAmount: 285,
        currency: 'EGP',
        catalogUrl: 'https://burger.digitalmenu.daleel-al-suez.com/',
      });

      const decodedText = decodeURIComponent(url.split('?text=')[1]);
      assert.ok(decodedText.includes('👤 *اسم العميل:* إبراهيم علي'));
      assert.ok(decodedText.includes('📝 *ملاحظات الطلب:* طاولة رقم 4'));
      assert.ok(decodedText.includes('1. *سوبر برجر* (حجم لارج)'));
      assert.ok(decodedText.includes('الكمية: 2 × 125.00 ج.م = 250.00 ج.م'));
      assert.ok(decodedText.includes('الإضافات: إضافات: جبنة شيدر (+15 ج.م)'));
      assert.ok(decodedText.includes('ملاحظة: بدون بصل'));
      assert.ok(decodedText.includes('2. *بطاطس مقلية*'));
      assert.ok(decodedText.includes('الكمية: 1 × 35.00 ج.م = 35.00 ج.م'));
      assert.ok(decodedText.includes('الإجمالي النهائي:* 285.00 ج.م'));
    });
  });

  describe('24-Hour Expiration TTL (isCartExpired)', () => {
    it('returns false for cart updated 2 hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      assert.equal(isCartExpired(twoHoursAgo), false);
    });

    it('returns false for cart updated right now', () => {
      assert.equal(isCartExpired(new Date().toISOString()), false);
    });

    it('returns true for cart updated 25 hours ago', () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      assert.equal(isCartExpired(twentyFiveHoursAgo), true);
    });

    it('returns true for cart updated 7 days ago', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      assert.equal(isCartExpired(sevenDaysAgo), true);
    });

    it('returns false when updatedAt is undefined or invalid', () => {
      assert.equal(isCartExpired(undefined), false);
      assert.equal(isCartExpired('invalid-date'), false);
    });

    it('CART_EXPIRATION_TTL_MS is exactly 24 hours in milliseconds', () => {
      assert.equal(CART_EXPIRATION_TTL_MS, 86_400_000);
    });
  });

  describe('Catalog Synchronization & Out-of-Stock Guard (syncCartItems)', () => {
    it('flags cart item as unavailable if product is marked is_available: false', () => {
      const cartItems = [
        {
          id: `${validProductId}_base_`,
          productId: validProductId,
          productName: 'برجر',
          unitPrice: 100,
          quantity: 2,
          lineTotal: 200,
          isAvailable: true,
        },
      ];

      const catalogProducts = [
        { id: validProductId, price: 100, is_available: false },
      ];

      const { updatedItems, hasChanges } = syncCartItems(cartItems, catalogProducts);
      assert.equal(hasChanges, true);
      assert.equal(updatedItems[0].isAvailable, false);
    });

    it('auto-updates unitPrice and sets priceChanged when catalog price increases', () => {
      const cartItems = [
        {
          id: `${validProductId}_base_`,
          productId: validProductId,
          productName: 'برجر',
          unitPrice: 100,
          quantity: 2,
          lineTotal: 200,
          isAvailable: true,
        },
      ];

      const catalogProducts = [
        { id: validProductId, price: 120, is_available: true },
      ];

      const { updatedItems, hasChanges } = syncCartItems(cartItems, catalogProducts);
      assert.equal(hasChanges, true);
      assert.equal(updatedItems[0].unitPrice, 120);
      assert.equal(updatedItems[0].lineTotal, 240);
      assert.equal(updatedItems[0].priceChanged, true);
    });

    it('flags item unavailable if product is completely removed from catalog', () => {
      const cartItems = [
        {
          id: `${validProductId}_base_`,
          productId: validProductId,
          productName: 'برجر',
          unitPrice: 100,
          quantity: 1,
          lineTotal: 100,
        },
      ];

      const catalogProducts: Array<{ id: string; price: number }> = [];

      const { updatedItems, hasChanges } = syncCartItems(cartItems, catalogProducts);
      assert.equal(hasChanges, true);
      assert.equal(updatedItems[0].isAvailable, false);
    });

    it('detects no changes when prices and availability match', () => {
      const cartItems = [
        {
          id: `${validProductId}_base_`,
          productId: validProductId,
          productName: 'برجر',
          unitPrice: 100,
          quantity: 1,
          lineTotal: 100,
          isAvailable: true,
        },
      ];

      const catalogProducts = [
        { id: validProductId, price: 100, is_available: true },
      ];

      const { updatedItems, hasChanges } = syncCartItems(cartItems, catalogProducts);
      assert.equal(hasChanges, false);
      assert.equal(updatedItems[0].unitPrice, 100);
      assert.equal(updatedItems[0].isAvailable, true);
    });
  });

  describe('Cart Storage Partitioning & ID Generation', () => {
    it('partitions localStorage keys by storeSlug to prevent tenant contamination', () => {
      assert.equal(getCartStorageKey('al-baraka'), 'digital_menu_cart_al-baraka');
      assert.equal(getCartStorageKey('  Cafe-Corner  '), 'digital_menu_cart_cafe-corner');
    });

    it('generates consistent deterministic item ID based on product, variant, and options', () => {
      const id1 = generateCartItemId(validProductId, validVariantId, [
        { groupId: 'g1', valueId: 'v1' },
      ]);
      const id2 = generateCartItemId(validProductId, validVariantId, [
        { groupId: 'g1', valueId: 'v1' },
      ]);
      assert.equal(id1, id2);

      const idDifferentVariant = generateCartItemId(validProductId, undefined, [
        { groupId: 'g1', valueId: 'v1' },
      ]);
      assert.notEqual(id1, idDifferentVariant);
    });
  });
});
