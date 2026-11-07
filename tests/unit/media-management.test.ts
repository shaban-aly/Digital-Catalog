import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ProductMediaInputSchema,
  UpdateMediaSortSchema,
  SetCoverImageSchema,
} from '../../src/shared/schemas.ts';
import { mediaService } from '../../src/server/services/media.ts';
import { storageService } from '../../src/server/services/storage.ts';

describe('Product Media Management (MED-001)', () => {
  const validProductId = '123e4567-e89b-12d3-a456-426614174000';
  const validMediaId = '223e4567-e89b-12d3-a456-426614174000';

  describe('ProductMediaInputSchema Validation', () => {
    it('accepts valid product media record under 200KB', () => {
      const validMedia = {
        product_id: validProductId,
        storage_path: 'biz-1/prod-1/burger.webp',
        public_url: 'https://digitalmenu.daleel-al-suez.com/storage/v1/object/public/product-images/burger.webp',
        file_size_bytes: 85000,
        is_cover: true,
        sort_order: 0,
      };

      const parsed = ProductMediaInputSchema.safeParse(validMedia);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.file_size_bytes, 85000);
        assert.equal(parsed.data.is_cover, true);
      }
    });

    it('rejects media record exceeding 200KB (204,800 bytes)', () => {
      const oversizedMedia = {
        product_id: validProductId,
        storage_path: 'biz-1/prod-1/huge.webp',
        public_url: 'https://example.com/huge.webp',
        file_size_bytes: 250000, // > 200KB
        is_cover: false,
        sort_order: 1,
      };

      const parsed = ProductMediaInputSchema.safeParse(oversizedMedia);
      assert.equal(parsed.success, false);
    });

    it('rejects invalid product_id UUID', () => {
      const invalid = {
        product_id: 'not-a-uuid',
        storage_path: 'path/file.webp',
        public_url: 'https://example.com/file.webp',
        file_size_bytes: 50000,
      };

      const parsed = ProductMediaInputSchema.safeParse(invalid);
      assert.equal(parsed.success, false);
    });

    it('rejects invalid public_url format', () => {
      const invalidUrl = {
        product_id: validProductId,
        storage_path: 'path/file.webp',
        public_url: 'not-a-valid-url',
        file_size_bytes: 50000,
      };

      const parsed = ProductMediaInputSchema.safeParse(invalidUrl);
      assert.equal(parsed.success, false);
    });
  });

  describe('UpdateMediaSortSchema & SetCoverImageSchema', () => {
    it('validates batch media gallery reorder payload', () => {
      const reorderPayload = [
        { id: validMediaId, sort_order: 0 },
        { id: '323e4567-e89b-12d3-a456-426614174000', sort_order: 1 },
      ];

      const parsed = UpdateMediaSortSchema.safeParse(reorderPayload);
      assert.equal(parsed.success, true);
    });

    it('rejects negative sort orders in media gallery', () => {
      const negativePayload = [{ id: validMediaId, sort_order: -1 }];
      const parsed = UpdateMediaSortSchema.safeParse(negativePayload);
      assert.equal(parsed.success, false);
    });

    it('validates SetCoverImageSchema payload', () => {
      const payload = {
        product_id: validProductId,
        media_id: validMediaId,
      };
      const parsed = SetCoverImageSchema.safeParse(payload);
      assert.equal(parsed.success, true);
    });
  });

  describe('Storage Path Generation (buildStoragePath)', () => {
    it('generates standardized storage path with timestamp and webp extension', () => {
      const path = mediaService.buildStoragePath('biz-123', 'prod-456', 'Shawarma Photo.jpg');
      assert.match(path, /^biz-123\/prod-456\/\d+-shawarma_photo\.jpg\.webp$/);
    });

    it('preserves existing webp extension without double extension', () => {
      const path = mediaService.buildStoragePath('biz-123', 'prod-456', 'pizza.webp');
      assert.match(path, /^biz-123\/prod-456\/\d+-pizza\.webp$/);
      assert.equal(path.includes('.webp.webp'), false);
    });
  });

  describe('Storage Provider Guards (storageService)', () => {
    it('rejects unsupported media MIME types', async () => {
      const fakeBuffer = new ArrayBuffer(1024);
      await assert.rejects(
        () => storageService.upload(fakeBuffer, 'test/doc.pdf', { contentType: 'application/pdf' }),
        /Unsupported media type/
      );
    });

    it('rejects files exceeding 200KB limit', async () => {
      const hugeBuffer = new ArrayBuffer(250 * 1024); // 250 KB
      await assert.rejects(
        () => storageService.upload(hugeBuffer, 'test/huge.webp', { contentType: 'image/webp' }),
        /exceeds the 200KB limit/
      );
    });

    it('generates clean public URLs for storage paths', () => {
      const url = storageService.getPublicUrl('biz-1/prod-1/img.webp');
      assert.equal(typeof url, 'string');
      assert.equal(url.length > 0, true);
      assert.equal(url.includes('img.webp'), true);
    });
  });
});

