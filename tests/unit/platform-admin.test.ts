import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PlatformAdminService } from '../../src/server/services/platform-admin.ts';
import {
  PlatformKpisSchema,
  ListBusinessesAdminQuerySchema,
  UpdateSubscriptionAdminSchema,
  UpdateBusinessStatusSchema,
} from '../../src/shared/schemas.ts';

describe('Platform Super Admin Dashboard (ADM-001)', () => {
  const superAdminId = '123e4567-e89b-12d3-a456-426614174000';
  const regularMerchantId = 'a0000000-0000-4000-8000-000000000001';
  const validBusinessId = 'b0000000-0000-4000-8000-000000000002';

  const adminService = new PlatformAdminService({
    superAdminIds: [superAdminId],
  });

  describe('Super Admin Authorization & Guard', () => {
    it('identifies authorized Super Admin correctly', async () => {
      const isSuper = await adminService.isSuperAdmin(superAdminId);
      assert.equal(isSuper, true);
    });

    it('denies Super Admin privileges to regular merchants', async () => {
      const isSuper = await adminService.isSuperAdmin(regularMerchantId);
      assert.equal(isSuper, false);
    });

    it('denies Super Admin privileges for empty or invalid IDs', async () => {
      assert.equal(await adminService.isSuperAdmin(''), false);
      // @ts-expect-error test invalid type
      assert.equal(await adminService.isSuperAdmin(null), false);
    });

    it('assertSuperAdmin succeeds for authorized admin', async () => {
      await assert.doesNotReject(async () => {
        await adminService.assertSuperAdmin(superAdminId);
      });
    });

    it('assertSuperAdmin throws Arabic 403 Forbidden for regular merchant', async () => {
      await assert.rejects(
        async () => {
          await adminService.assertSuperAdmin(regularMerchantId);
        },
        {
          name: 'Error',
          message: /غير مصرح لك بالوصول إلى لوحة تحكم المنصة/,
        }
      );
    });
  });

  describe('PlatformKpisSchema Validation', () => {
    it('accepts valid platform KPIs metrics', () => {
      const validKpis = {
        totalMerchants: 45,
        activeStores: 40,
        suspendedStores: 5,
        totalProducts: 850,
        totalQrScans: 3200,
      };

      const parsed = PlatformKpisSchema.parse(validKpis);
      assert.deepEqual(parsed, validKpis);
    });

    it('accepts zero values for new platform deployment', () => {
      const zeroKpis = {
        totalMerchants: 0,
        activeStores: 0,
        suspendedStores: 0,
        totalProducts: 0,
        totalQrScans: 0,
      };

      const parsed = PlatformKpisSchema.parse(zeroKpis);
      assert.deepEqual(parsed, zeroKpis);
    });

    it('rejects negative metric numbers', () => {
      assert.throws(() => {
        PlatformKpisSchema.parse({
          totalMerchants: -1,
          activeStores: 10,
          suspendedStores: 0,
          totalProducts: 50,
          totalQrScans: 100,
        });
      });
    });
  });

  describe('ListBusinessesAdminQuerySchema Validation', () => {
    it('applies default pagination values (page 1, limit 20)', () => {
      const parsed = ListBusinessesAdminQuerySchema.parse({});
      assert.equal(parsed.page, 1);
      assert.equal(parsed.limit, 20);
    });

    it('accepts valid search and status filter', () => {
      const parsed = ListBusinessesAdminQuerySchema.parse({
        search: 'baraka',
        status: 'suspended',
        page: 2,
        limit: 50,
      });

      assert.equal(parsed.search, 'baraka');
      assert.equal(parsed.status, 'suspended');
      assert.equal(parsed.page, 2);
      assert.equal(parsed.limit, 50);
    });

    it('rejects limit exceeding 100 to protect server resources', () => {
      assert.throws(() => {
        ListBusinessesAdminQuerySchema.parse({
          limit: 150,
        });
      });
    });

    it('rejects zero or negative page', () => {
      assert.throws(() => {
        ListBusinessesAdminQuerySchema.parse({
          page: 0,
        });
      });
      assert.throws(() => {
        ListBusinessesAdminQuerySchema.parse({
          page: -2,
        });
      });
    });
  });

  describe('UpdateSubscriptionAdminSchema Validation (Offline Egyptian Payment)', () => {
    it('accepts valid manual subscription upgrade with InstaPay notes', () => {
      const payload = {
        businessId: validBusinessId,
        planCode: 'pro' as const,
        maxProducts: 500,
        maxCategories: 30,
        subscriptionExpiresAt: '2027-11-06T00:00:00.000Z',
        adminNotes: 'تم السداد عبر إنستاباي - مرجع التحويل #984210',
      };

      const parsed = UpdateSubscriptionAdminSchema.parse(payload);
      assert.equal(parsed.planCode, 'pro');
      assert.equal(parsed.maxProducts, 500);
      assert.equal(parsed.maxCategories, 30);
      assert.equal(parsed.adminNotes, payload.adminNotes);
    });

    it('rejects invalid business UUID format', () => {
      assert.throws(
        () => {
          UpdateSubscriptionAdminSchema.parse({
            businessId: 'invalid-not-uuid',
            planCode: 'pro',
            maxProducts: 500,
            maxCategories: 30,
          });
        },
        {
          message: /UUID صالح/,
        }
      );
    });

    it('rejects non-positive max products and categories quotas', () => {
      assert.throws(() => {
        UpdateSubscriptionAdminSchema.parse({
          businessId: validBusinessId,
          planCode: 'pro',
          maxProducts: 0,
          maxCategories: 30,
        });
      });

      assert.throws(() => {
        UpdateSubscriptionAdminSchema.parse({
          businessId: validBusinessId,
          planCode: 'pro',
          maxProducts: 100,
          maxCategories: -5,
        });
      });
    });

    it('rejects invalid plan code', () => {
      assert.throws(
        () => {
          UpdateSubscriptionAdminSchema.parse({
            businessId: validBusinessId,
            // @ts-expect-error invalid plan
            planCode: 'unlimited_super',
            maxProducts: 100,
            maxCategories: 10,
          });
        },
        {
          message: /كود الباقة غير صالح/,
        }
      );
    });

    it('rejects admin notes exceeding 500 characters', () => {
      assert.throws(
        () => {
          UpdateSubscriptionAdminSchema.parse({
            businessId: validBusinessId,
            planCode: 'pro',
            maxProducts: 500,
            maxCategories: 30,
            adminNotes: 'أ'.repeat(501),
          });
        },
        {
          message: /ألا تتجاوز 500 حرف/,
        }
      );
    });
  });

  describe('UpdateBusinessStatusSchema Validation', () => {
    it('accepts valid status transitions (active, suspended, archived)', () => {
      const activeParsed = UpdateBusinessStatusSchema.parse({
        businessId: validBusinessId,
        status: 'active',
      });
      assert.equal(activeParsed.status, 'active');

      const suspendedParsed = UpdateBusinessStatusSchema.parse({
        businessId: validBusinessId,
        status: 'suspended',
        reason: 'إيقاف مؤقت للصيانة وتحديث الأسعار',
      });
      assert.equal(suspendedParsed.status, 'suspended');
      assert.equal(suspendedParsed.reason, 'إيقاف مؤقت للصيانة وتحديث الأسعار');
    });

    it('rejects invalid operational status', () => {
      assert.throws(
        () => {
          UpdateBusinessStatusSchema.parse({
            businessId: validBusinessId,
            // @ts-expect-error invalid status
            status: 'deleted',
          });
        },
        {
          message: /حالة المتجر غير صالحة/,
        }
      );
    });
  });

  describe('PlatformAdminService Operations', () => {
    it('getPlatformKpis returns valid KPI object for authorized admin', async () => {
      const kpis = await adminService.getPlatformKpis(superAdminId);
      assert.equal(typeof kpis.totalMerchants, 'number');
      assert.equal(typeof kpis.activeStores, 'number');
      assert.equal(typeof kpis.suspendedStores, 'number');
      assert.equal(typeof kpis.totalProducts, 'number');
      assert.equal(typeof kpis.totalQrScans, 'number');
    });

    it('getPlatformKpis rejects non-admin users', async () => {
      await assert.rejects(async () => {
        await adminService.getPlatformKpis(regularMerchantId);
      });
    });

    it('listBusinesses returns paginated store list for authorized admin', async () => {
      const result = await adminService.listBusinesses(superAdminId, {
        page: 1,
        limit: 10,
      });

      assert.equal(result.page, 1);
      assert.equal(result.limit, 10);
      assert.ok(Array.isArray(result.businesses));
      assert.equal(typeof result.total, 'number');
    });

    it('getReservedSlugs lists platform reserved subdomains for authorized admin', async () => {
      const reserved = await adminService.getReservedSlugs(superAdminId);
      assert.ok(Array.isArray(reserved));
      assert.ok(reserved.includes('admin'));
      assert.ok(reserved.includes('api'));
      assert.ok(reserved.includes('billing'));
      assert.ok(reserved.includes('support'));
      assert.ok(reserved.includes('digitalmenu'));
    });

    it('getReservedSlugs rejects non-admin users', async () => {
      await assert.rejects(async () => {
        await adminService.getReservedSlugs(regularMerchantId);
      });
    });
  });
});
