import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ToggleCatalogPublishSchema,
  UpdateBusinessStatusSchema,
  ResolveStoreAvailabilitySchema,
} from '../../src/shared/schemas.ts';
import { lifecycleService } from '../../src/server/services/lifecycle.ts';
import type { StoreLifecycleResolution } from '../../src/shared/types.ts';

describe('Store and Catalog Lifecycle (LIF-001)', () => {
  const validCatalogId = '123e4567-e89b-12d3-a456-426614174000';
  const validBusinessId = 'a0000000-0000-4000-8000-000000000001';

  describe('ToggleCatalogPublishSchema Validation', () => {
    it('accepts valid catalogId and boolean isPublished', () => {
      const valid = {
        catalogId: validCatalogId,
        isPublished: true,
      };
      const result = ToggleCatalogPublishSchema.parse(valid);
      assert.equal(result.isPublished, true);
      assert.equal(result.catalogId, valid.catalogId);
    });

    it('accepts isPublished = false for unpublishing', () => {
      const valid = {
        catalogId: validCatalogId,
        isPublished: false,
      };
      const result = ToggleCatalogPublishSchema.parse(valid);
      assert.equal(result.isPublished, false);
    });

    it('rejects invalid UUID in catalogId', () => {
      assert.throws(
        () => ToggleCatalogPublishSchema.parse({ catalogId: 'not-a-uuid', isPublished: true }),
        /معرف القائمة يجب أن يكون UUID صالح/
      );
    });

    it('rejects non-boolean isPublished values', () => {
      assert.throws(
        () => ToggleCatalogPublishSchema.parse({
          catalogId: validCatalogId,
          isPublished: 'true' as any,
        })
      );
    });
  });

  describe('UpdateBusinessStatusSchema Validation', () => {
    it('accepts valid active, suspended, and archived statuses', () => {
      const active = UpdateBusinessStatusSchema.parse({ businessId: validBusinessId, status: 'active' });
      assert.equal(active.status, 'active');

      const suspended = UpdateBusinessStatusSchema.parse({
        businessId: validBusinessId,
        status: 'suspended',
        reason: 'Payment review',
      });
      assert.equal(suspended.status, 'suspended');
      assert.equal(suspended.reason, 'Payment review');

      const archived = UpdateBusinessStatusSchema.parse({ businessId: validBusinessId, status: 'archived' });
      assert.equal(archived.status, 'archived');
    });

    it('rejects invalid business status values', () => {
      assert.throws(
        () =>
          UpdateBusinessStatusSchema.parse({
            businessId: 'b0000000-0000-0000-0000-000000000001',
            status: 'deleted' as any,
          }),
        /حالة المتجر غير صالحة/
      );
    });

    it('rejects invalid UUID in businessId', () => {
      assert.throws(
        () =>
          UpdateBusinessStatusSchema.parse({
            businessId: 'invalid-id',
            status: 'active',
          }),
        /معرف المتجر يجب أن يكون UUID صالح/
      );
    });

    it('rejects reason exceeding 255 characters', () => {
      assert.throws(() =>
        UpdateBusinessStatusSchema.parse({
          businessId: 'b0000000-0000-0000-0000-000000000001',
          status: 'suspended',
          reason: 'A'.repeat(256),
        })
      );
    });
  });

  describe('ResolveStoreAvailabilitySchema Validation', () => {
    it('accepts valid DNS slug (3-63 chars)', () => {
      const res = ResolveStoreAvailabilitySchema.parse({ slug: 'ahmed-cafe' });
      assert.equal(res.slug, 'ahmed-cafe');
    });

    it('rejects short slugs (< 3 chars)', () => {
      assert.throws(
        () => ResolveStoreAvailabilitySchema.parse({ slug: 'ab' }),
        /اسم المتجر يجب أن يكون 3 أحرف على الأقل/
      );
    });

    it('rejects slugs exceeding 63 chars', () => {
      assert.throws(
        () => ResolveStoreAvailabilitySchema.parse({ slug: 'a'.repeat(64) }),
        /اسم المتجر يجب ألا يتجاوز 63 حرفاً/
      );
    });
  });

  describe('Edge Lifecycle Response Rendering (renderLifecycleResponse)', () => {
    it('returns null for active published store to allow normal rendering', () => {
      const activeRes: StoreLifecycleResolution = {
        status: 'active',
        businessId: 'b0000000-0000-0000-0000-000000000001',
        businessName: 'مقهى الأمل',
        businessSlug: 'al-amal-cafe',
        catalogId: 'c0000000-0000-0000-0000-000000000001',
        isPublished: true,
      };

      const response = lifecycleService.renderLifecycleResponse(activeRes, 'al-amal-cafe');
      assert.equal(response, null);
    });

    it('renders 403 Forbidden with Arabic message for unpublished store', async () => {
      const unpubRes: StoreLifecycleResolution = {
        status: 'unpublished',
        businessId: 'b0000000-0000-0000-0000-000000000001',
        businessName: 'مقهى الأمل',
        businessSlug: 'al-amal-cafe',
        catalogId: 'c0000000-0000-0000-0000-000000000001',
        isPublished: false,
      };

      const response = lifecycleService.renderLifecycleResponse(unpubRes, 'al-amal-cafe');
      assert.notEqual(response, null);
      assert.equal(response!.status, 403);
      assert.equal(response!.headers.get('Cache-Control'), 'no-cache, no-store, must-revalidate');

      const html = await response!.text();
      assert.ok(html.includes('قيد التجهيز حالياً'));
      assert.ok(html.includes('al-amal-cafe'));
      assert.ok(html.includes('dir="rtl"'));
    });

    it('renders 403 Forbidden with Arabic message for suspended store', async () => {
      const suspendedRes: StoreLifecycleResolution = {
        status: 'suspended',
        businessId: 'b0000000-0000-0000-0000-000000000001',
        businessName: 'متجر محظور',
        businessSlug: 'banned-shop',
      };

      const response = lifecycleService.renderLifecycleResponse(suspendedRes, 'banned-shop');
      assert.notEqual(response, null);
      assert.equal(response!.status, 403);
      assert.equal(response!.headers.get('Cache-Control'), 'no-cache, no-store, must-revalidate');

      const html = await response!.text();
      assert.ok(html.includes('معطل مؤقتاً'));
      assert.ok(html.includes('banned-shop'));
      assert.ok(html.includes('dir="rtl"'));
    });

    it('renders 403 Forbidden for archived store', async () => {
      const archivedRes: StoreLifecycleResolution = {
        status: 'archived',
        businessId: 'b0000000-0000-0000-0000-000000000001',
        businessName: 'متجر مغلق',
        businessSlug: 'closed-shop',
      };

      const response = lifecycleService.renderLifecycleResponse(archivedRes, 'closed-shop');
      assert.notEqual(response, null);
      assert.equal(response!.status, 403);

      const html = await response!.text();
      assert.ok(html.includes('معطل مؤقتاً'));
      assert.ok(html.includes('closed-shop'));
    });

    it('renders 404 Not Found for non-existent store', async () => {
      const notFoundRes: StoreLifecycleResolution = {
        status: 'not_found',
        slug: 'nonexistent-shop',
      };

      const response = lifecycleService.renderLifecycleResponse(notFoundRes, 'nonexistent-shop');
      assert.notEqual(response, null);
      assert.equal(response!.status, 404);
      assert.equal(response!.headers.get('Cache-Control'), 'no-cache, no-store, must-revalidate');

      const html = await response!.text();
      assert.ok(html.includes('المتجر غير موجود'));
      assert.ok(html.includes('nonexistent-shop.digitalmenu.daleel-al-suez.com'));
    });

    it('renders 404 Not Found for reserved system slug', async () => {
      const reservedRes: StoreLifecycleResolution = {
        status: 'reserved',
        slug: 'admin',
      };

      const response = lifecycleService.renderLifecycleResponse(reservedRes, 'admin');
      assert.notEqual(response, null);
      assert.equal(response!.status, 404);

      const html = await response!.text();
      assert.ok(html.includes('نطاق نظام محجوز'));
    });
  });

  describe('Edge Case & Security Bounds', () => {
    it('detects reserved system subdomains before hitting database', async () => {
      const res = await lifecycleService.resolveStoreAvailability('admin');
      assert.equal(res.status, 'reserved');

      const resApi = await lifecycleService.resolveStoreAvailability('api');
      assert.equal(resApi.status, 'reserved');

      const resTools = await lifecycleService.resolveStoreAvailability('tools');
      assert.equal(resTools.status, 'reserved');
    });

    it('handles malformed short slugs safely without throwing', async () => {
      const res = await lifecycleService.resolveStoreAvailability('x');
      assert.equal(res.status, 'not_found');
    });
  });
});
