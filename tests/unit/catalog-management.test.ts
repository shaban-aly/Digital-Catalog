import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CategoryInputSchema,
  UpdateCategoryInputSchema,
  CatalogItemInputSchema,
  UpdateCatalogItemInputSchema,
  BatchReorderCategoriesSchema,
} from '../../src/shared/schemas.ts';
import { catalogService } from '../../src/server/services/catalog.ts';

describe('Catalog & Category Management (CAT-001)', () => {
  describe('CategoryInputSchema Validation', () => {
    it('accepts valid Arabic-only category name', () => {
      const valid = {
        name: { ar: 'مشويات ومقبلات' },
        sort_order: 1,
        is_active: true,
      };
      const parsed = CategoryInputSchema.safeParse(valid);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.name.ar, 'مشويات ومقبلات');
        assert.equal(parsed.data.sort_order, 1);
        assert.equal(parsed.data.is_active, true);
      }
    });

    it('accepts valid bilingual Arabic and English category name', () => {
      const valid = {
        name: { ar: 'حلويات شرقية', en: 'Oriental Desserts' },
        sort_order: 2,
        is_active: true,
      };
      const parsed = CategoryInputSchema.safeParse(valid);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.name.ar, 'حلويات شرقية');
        assert.equal(parsed.data.name.en, 'Oriental Desserts');
      }
    });

    it('rejects category when Arabic name is missing or empty', () => {
      const missingAr = {
        name: { en: 'Desserts only' },
        sort_order: 1,
      };
      const parsed = CategoryInputSchema.safeParse(missingAr);
      assert.equal(parsed.success, false);

      const emptyAr = {
        name: { ar: '   ', en: 'Desserts' },
        sort_order: 1,
      };
      const parsedEmpty = CategoryInputSchema.safeParse(emptyAr);
      assert.equal(parsedEmpty.success, false);
    });

    it('assigns default sort_order 0 and is_active true when omitted', () => {
      const minimal = {
        name: { ar: 'مشروبات باردة' },
      };
      const parsed = CategoryInputSchema.safeParse(minimal);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.sort_order, 0);
        assert.equal(parsed.data.is_active, true);
      }
    });
  });

  describe('UpdateCategoryInputSchema & Batch Reorder', () => {
    it('allows partial updates to category name, order, or active flag', () => {
      const partialUpdate = {
        is_active: false,
        sort_order: 5,
      };
      const parsed = UpdateCategoryInputSchema.safeParse(partialUpdate);
      assert.equal(parsed.success, true);
    });

    it('validates batch reorder category payload', () => {
      const batchPayload = [
        { id: '123e4567-e89b-12d3-a456-426614174000', sort_order: 0 },
        { id: '223e4567-e89b-12d3-a456-426614174000', sort_order: 1 },
      ];
      const parsed = BatchReorderCategoriesSchema.safeParse(batchPayload);
      assert.equal(parsed.success, true);
    });

    it('rejects negative sort orders in batch reorder', () => {
      const negativePayload = [
        { id: '123e4567-e89b-12d3-a456-426614174000', sort_order: -1 },
      ];
      const parsed = BatchReorderCategoriesSchema.safeParse(negativePayload);
      assert.equal(parsed.success, false);
    });
  });

  describe('CatalogItemInputSchema Validation', () => {
    const validCatalogItem = {
      catalog_id: '123e4567-e89b-12d3-a456-426614174000',
      product_id: '223e4567-e89b-12d3-a456-426614174000',
      category_id: '323e4567-e89b-12d3-a456-426614174000',
      price_override: 85.5,
      sort_order: 0,
      is_featured: true,
      is_available: true,
    };

    it('accepts valid catalog item with positive price override', () => {
      const parsed = CatalogItemInputSchema.safeParse(validCatalogItem);
      assert.equal(parsed.success, true);
    });

    it('accepts null or undefined price_override', () => {
      const withoutOverride = {
        ...validCatalogItem,
        price_override: null,
      };
      const parsed = CatalogItemInputSchema.safeParse(withoutOverride);
      assert.equal(parsed.success, true);
    });

    it('rejects invalid UUIDs in catalog item references', () => {
      const invalid = {
        ...validCatalogItem,
        catalog_id: 'not-a-uuid',
      };
      const parsed = CatalogItemInputSchema.safeParse(invalid);
      assert.equal(parsed.success, false);
    });

    it('rejects negative or zero price overrides', () => {
      const invalidPrice = {
        ...validCatalogItem,
        price_override: -10,
      };
      const parsed = CatalogItemInputSchema.safeParse(invalidPrice);
      assert.equal(parsed.success, false);
    });
  });

  describe('Presentation Effective Price Calculation (Decoupled Domain)', () => {
    it('uses presentation price_override when present', () => {
      const effective = catalogService.calculateEffectivePrice(100.0, 85.0);
      assert.equal(effective, 85.0);
    });

    it('falls back to master product base_price when price_override is null', () => {
      const effective = catalogService.calculateEffectivePrice(120.0, null);
      assert.equal(effective, 120.0);
    });

    it('falls back to master product base_price when price_override is undefined', () => {
      const effective = catalogService.calculateEffectivePrice(150.0, undefined);
      assert.equal(effective, 150.0);
    });

    it('returns 0 when neither price is specified', () => {
      const effective = catalogService.calculateEffectivePrice(null, null);
      assert.equal(effective, 0);
    });
  });
});
