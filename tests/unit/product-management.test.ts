import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CreateProductInputSchema,
  ProductVariantSchema,
  ProductOptionGroupSchema,
} from '../../src/shared/schemas.ts';
import { productService } from '../../src/server/services/product.ts';

describe('Product, Variant, and Modifier Management (PRD-001)', () => {
  const validCategoryId = '123e4567-e89b-12d3-a456-426614174000';

  describe('CreateProductInputSchema Validation', () => {
    it('accepts valid standard product with Arabic name, category, and base price', () => {
      const validProduct = {
        category_id: validCategoryId,
        name: { ar: 'بيتزا مارجريتا', en: 'Pizza Margherita' },
        description: { ar: 'صلصة طماطم وجبنة موتزاريلا وريحان' },
        base_price: 95.0,
        compare_at_price: 110.0,
        unit: 'piece',
        status: 'active' as const,
      };

      const parsed = CreateProductInputSchema.safeParse(validProduct);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.name.ar, 'بيتزا مارجريتا');
        assert.equal(parsed.data.base_price, 95.0);
        assert.equal(parsed.data.unit, 'piece');
      }
    });

    it('rejects product when category_id is not a valid UUID', () => {
      const invalid = {
        category_id: 'invalid-id',
        name: { ar: 'شاورما دجاج' },
        base_price: 50,
      };
      const parsed = CreateProductInputSchema.safeParse(invalid);
      assert.equal(parsed.success, false);
    });

    it('rejects product with negative base price', () => {
      const negativePrice = {
        category_id: validCategoryId,
        name: { ar: 'شاورما لحم' },
        base_price: -25,
      };
      const parsed = CreateProductInputSchema.safeParse(negativePrice);
      assert.equal(parsed.success, false);
    });

    it('rejects product when Arabic name is missing or empty', () => {
      const missingAr = {
        category_id: validCategoryId,
        name: { en: 'Shawarma only' },
        base_price: 50,
      };
      const parsed = CreateProductInputSchema.safeParse(missingAr);
      assert.equal(parsed.success, false);
    });
  });

  describe('ProductVariantSchema & Multi-Variant Limits', () => {
    it('accepts valid product variant with positive price', () => {
      const validVariant = {
        name: { ar: 'حجم عائلي', en: 'Family Size' },
        price: 145.0,
        compare_at_price: 165.0,
        is_available: true,
      };
      const parsed = ProductVariantSchema.safeParse(validVariant);
      assert.equal(parsed.success, true);
    });

    it('rejects product variant with zero or negative price', () => {
      const zeroPrice = {
        name: { ar: 'حجم مجاني' },
        price: 0,
      };
      assert.equal(ProductVariantSchema.safeParse(zeroPrice).success, false);

      const negativePrice = {
        name: { ar: 'حجم سالب' },
        price: -10,
      };
      assert.equal(ProductVariantSchema.safeParse(negativePrice).success, false);
    });

    it('rejects exceeding 10 variants per product', () => {
      const elevenVariants = Array.from({ length: 11 }, (_, i) => ({
        name: { ar: `متغير ${i + 1}` },
        price: 10 + i,
      }));

      const productWithTooManyVariants = {
        category_id: validCategoryId,
        name: { ar: 'منتج بمتغيرات كثيرة' },
        variants: elevenVariants,
      };

      const parsed = CreateProductInputSchema.safeParse(productWithTooManyVariants);
      assert.equal(parsed.success, false);
    });
  });

  describe('ProductOptionGroupSchema & Selection Constraints', () => {
    it('accepts valid option group with modifier values', () => {
      const validGroup = {
        name: { ar: 'إضافات الجبن', en: 'Cheese Toppings' },
        is_required: false,
        min_selections: 0,
        max_selections: 2,
        values: [
          { name: { ar: 'شيدر إضافية' }, price_delta: 15.0 },
          { name: { ar: 'موتزاريلا إضافية' }, price_delta: 20.0 },
        ],
      };
      const parsed = ProductOptionGroupSchema.safeParse(validGroup);
      assert.equal(parsed.success, true);
    });

    it('rejects option group with empty values array', () => {
      const emptyGroup = {
        name: { ar: 'مجموعة فارغة' },
        values: [],
      };
      const parsed = ProductOptionGroupSchema.safeParse(emptyGroup);
      assert.equal(parsed.success, false);
    });

    it('rejects option group when min_selections exceeds max_selections', () => {
      const invertedGroup = {
        name: { ar: 'مجموعة متناقضة' },
        min_selections: 3,
        max_selections: 1,
        values: [{ name: { ar: 'خيار 1' } }],
      };
      const parsed = ProductOptionGroupSchema.safeParse(invertedGroup);
      assert.equal(parsed.success, false);
    });
  });

  describe('Deterministic Price Calculation (calculateLineItemPrice)', () => {
    it('calculates total for base price and modifier deltas', () => {
      const price = productService.calculateLineItemPrice({
        basePrice: 50.0,
        optionDeltas: [10.0, 15.5],
      });
      assert.equal(price, 75.5);
    });

    it('overrides base price with variant price when variant is selected', () => {
      const price = productService.calculateLineItemPrice({
        basePrice: 50.0,
        variantPrice: 85.0,
        optionDeltas: [5.0],
      });
      assert.equal(price, 90.0);
    });

    it('overrides variant price with catalog price override when present', () => {
      const price = productService.calculateLineItemPrice({
        basePrice: 50.0,
        variantPrice: 85.0,
        catalogOverride: 75.0,
        optionDeltas: [10.0],
      });
      assert.equal(price, 85.0);
    });

    it('handles decimal precision without floating point drift', () => {
      const price = productService.calculateLineItemPrice({
        basePrice: 10.1,
        optionDeltas: [20.2],
      });
      assert.equal(price, 30.3);
    });

    it('returns 0 when no prices are provided', () => {
      const price = productService.calculateLineItemPrice({});
      assert.equal(price, 0);
    });
  });

  describe('Option Group Selection Validation (validateOptionGroupSelections)', () => {
    it('enforces required single-select rules (min: 1, max: 1, required: true)', () => {
      const group = { min_selections: 1, max_selections: 1, is_required: true };
      assert.equal(productService.validateOptionGroupSelections(group, 0).valid, false);
      assert.equal(productService.validateOptionGroupSelections(group, 1).valid, true);
      assert.equal(productService.validateOptionGroupSelections(group, 2).valid, false);
    });

    it('enforces optional multi-select rules (min: 0, max: 3, required: false)', () => {
      const group = { min_selections: 0, max_selections: 3, is_required: false };
      assert.equal(productService.validateOptionGroupSelections(group, 0).valid, true);
      assert.equal(productService.validateOptionGroupSelections(group, 2).valid, true);
      assert.equal(productService.validateOptionGroupSelections(group, 3).valid, true);
      assert.equal(productService.validateOptionGroupSelections(group, 4).valid, false);
    });

    it('enforces mandatory multi-select rules (min: 2, max: 4, required: true)', () => {
      const group = { min_selections: 2, max_selections: 4, is_required: true };
      assert.equal(productService.validateOptionGroupSelections(group, 1).valid, false);
      assert.equal(productService.validateOptionGroupSelections(group, 2).valid, true);
      assert.equal(productService.validateOptionGroupSelections(group, 4).valid, true);
      assert.equal(productService.validateOptionGroupSelections(group, 5).valid, false);
    });
  });
});

