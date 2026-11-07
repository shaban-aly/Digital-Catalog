import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationService } from '../../src/server/services/notification.ts';
import {
  CreateNotificationSchema,
  ListNotificationsQuerySchema,
  MarkNotificationReadSchema,
  MarkAllNotificationsReadSchema,
  NotificationTypeSchema,
  NotificationSeveritySchema,
} from '../../src/shared/schemas.ts';

describe('Merchant Notifications & In-App Alerts (NOT-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';
  const otherBusinessId = 'b0000000-0000-4000-8000-000000000002';
  const validNotificationId = 'a0000000-0000-4000-8000-000000000001';
  const service = new NotificationService();

  describe('NotificationType & Severity Schema Validation', () => {
    it('accepts all 4 standard notification types', () => {
      assert.equal(NotificationTypeSchema.parse('quota_warning'), 'quota_warning');
      assert.equal(NotificationTypeSchema.parse('subscription_activated'), 'subscription_activated');
      assert.equal(NotificationTypeSchema.parse('store_status_changed'), 'store_status_changed');
      assert.equal(NotificationTypeSchema.parse('system_announcement'), 'system_announcement');
    });

    it('rejects unrecognized notification type', () => {
      assert.throws(() => {
        NotificationTypeSchema.parse('unknown_event');
      });
    });

    it('accepts all 4 severity levels', () => {
      assert.equal(NotificationSeveritySchema.parse('info'), 'info');
      assert.equal(NotificationSeveritySchema.parse('warning'), 'warning');
      assert.equal(NotificationSeveritySchema.parse('critical'), 'critical');
      assert.equal(NotificationSeveritySchema.parse('success'), 'success');
    });

    it('rejects invalid severity level', () => {
      assert.throws(() => {
        NotificationSeveritySchema.parse('urgent_danger');
      });
    });
  });

  describe('CreateNotificationSchema Validation', () => {
    it('accepts valid quota warning notification payload', () => {
      const payload = {
        businessId: validBusinessId,
        type: 'quota_warning' as const,
        severity: 'warning' as const,
        titleAr: 'اقتراب نفاد حد المنتجات',
        bodyAr: 'لقد استهلكت 80% من حد المنتجات المتاح في باقتك الحالية (80 من أصل 100 منتج).',
        actionUrl: '/dashboard/billing',
      };

      const parsed = CreateNotificationSchema.parse(payload);
      assert.equal(parsed.businessId, validBusinessId);
      assert.equal(parsed.type, 'quota_warning');
      assert.equal(parsed.severity, 'warning');
      assert.equal(parsed.titleAr, payload.titleAr);
      assert.equal(parsed.actionUrl, '/dashboard/billing');
    });

    it('defaults severity to info when omitted', () => {
      const parsed = CreateNotificationSchema.parse({
        businessId: validBusinessId,
        type: 'system_announcement',
        titleAr: 'تحديث جديد بالمنصة',
        bodyAr: 'تم إضافة ميزة سلة طلبات الواتساب الجديدة في متجرك.',
      });

      assert.equal(parsed.severity, 'info');
    });

    it('rejects invalid businessId UUID', () => {
      assert.throws(
        () => {
          CreateNotificationSchema.parse({
            businessId: 'not-a-uuid',
            type: 'quota_warning',
            titleAr: 'تنبيه',
            bodyAr: 'نص التنبيه التجريبي',
          });
        },
        {
          message: /UUID صالح/,
        }
      );
    });

    it('rejects title shorter than 3 characters', () => {
      assert.throws(
        () => {
          CreateNotificationSchema.parse({
            businessId: validBusinessId,
            type: 'quota_warning',
            titleAr: 'أو',
            bodyAr: 'نص التنبيه التجريبي',
          });
        },
        {
          message: /3 أحرف على الأقل/,
        }
      );
    });

    it('rejects title longer than 150 characters', () => {
      assert.throws(
        () => {
          CreateNotificationSchema.parse({
            businessId: validBusinessId,
            type: 'quota_warning',
            titleAr: 'أ'.repeat(151),
            bodyAr: 'نص التنبيه التجريبي',
          });
        },
        {
          message: /ألا يتجاوز 150 حرف/,
        }
      );
    });

    it('rejects body shorter than 5 characters', () => {
      assert.throws(
        () => {
          CreateNotificationSchema.parse({
            businessId: validBusinessId,
            type: 'quota_warning',
            titleAr: 'تنبيه مهم',
            bodyAr: 'أمر',
          });
        },
        {
          message: /5 أحرف على الأقل/,
        }
      );
    });

    it('rejects body longer than 1000 characters', () => {
      assert.throws(
        () => {
          CreateNotificationSchema.parse({
            businessId: validBusinessId,
            type: 'quota_warning',
            titleAr: 'تنبيه مهم',
            bodyAr: 'أ'.repeat(1001),
          });
        },
        {
          message: /ألا يتجاوز 1000 حرف/,
        }
      );
    });
  });

  describe('ListNotificationsQuerySchema Validation', () => {
    it('applies default pagination values (page 1, limit 20, unreadOnly false)', () => {
      const parsed = ListNotificationsQuerySchema.parse({
        businessId: validBusinessId,
      });

      assert.equal(parsed.page, 1);
      assert.equal(parsed.limit, 20);
      assert.equal(parsed.unreadOnly, false);
    });

    it('accepts unreadOnly filter and custom pagination', () => {
      const parsed = ListNotificationsQuerySchema.parse({
        businessId: validBusinessId,
        unreadOnly: true,
        page: 3,
        limit: 50,
      });

      assert.equal(parsed.unreadOnly, true);
      assert.equal(parsed.page, 3);
      assert.equal(parsed.limit, 50);
    });

    it('rejects limit exceeding 100', () => {
      assert.throws(() => {
        ListNotificationsQuerySchema.parse({
          businessId: validBusinessId,
          limit: 101,
        });
      });
    });

    it('rejects zero or negative page', () => {
      assert.throws(() => {
        ListNotificationsQuerySchema.parse({
          businessId: validBusinessId,
          page: 0,
        });
      });
    });
  });

  describe('MarkNotificationReadSchema Validation', () => {
    it('accepts valid mark-as-read parameters', () => {
      const parsed = MarkNotificationReadSchema.parse({
        businessId: validBusinessId,
        notificationId: validNotificationId,
      });

      assert.equal(parsed.businessId, validBusinessId);
      assert.equal(parsed.notificationId, validNotificationId);
    });

    it('rejects invalid notificationId UUID', () => {
      assert.throws(
        () => {
          MarkNotificationReadSchema.parse({
            businessId: validBusinessId,
            notificationId: 'not-valid-uuid',
          });
        },
        {
          message: /UUID صالح/,
        }
      );
    });

    it('accepts valid markAllAsRead schema', () => {
      const parsed = MarkAllNotificationsReadSchema.parse({
        businessId: validBusinessId,
      });

      assert.equal(parsed.businessId, validBusinessId);
    });
  });

  describe('NotificationService Operations & Lifecycle', () => {
    it('creates in-app notification and returns populated entity', async () => {
      const notification = await service.createNotification({
        businessId: validBusinessId,
        type: 'subscription_activated',
        severity: 'success',
        titleAr: 'تم تفعيل باقة برو بنجاح',
        bodyAr: 'تهانينا! تم استلام تحويل إنستاباي وتفعيل باقة برو لمتجرك حتى 2027.',
        actionUrl: '/dashboard/billing',
      });

      assert.ok(notification.id);
      assert.equal(notification.businessId, validBusinessId);
      assert.equal(notification.type, 'subscription_activated');
      assert.equal(notification.severity, 'success');
      assert.equal(notification.readAt, null);
      assert.ok(notification.createdAt);
    });

    it('lists notifications returning paginated results', async () => {
      const result = await service.listNotifications({
        businessId: validBusinessId,
        page: 1,
        limit: 10,
      });

      assert.equal(result.page, 1);
      assert.equal(result.limit, 10);
      assert.ok(Array.isArray(result.notifications));
      assert.equal(typeof result.total, 'number');
    });

    it('getUnreadCount returns non-negative number', async () => {
      const unreadCount = await service.getUnreadCount(validBusinessId);
      assert.equal(typeof unreadCount, 'number');
      assert.ok(unreadCount >= 0);
    });

    it('getUnreadCount returns 0 for invalid or empty input', async () => {
      assert.equal(await service.getUnreadCount(''), 0);
      // @ts-expect-error test invalid type
      assert.equal(await service.getUnreadCount(null), 0);
    });

    it('markAsRead sets readAt timestamp', async () => {
      const result = await service.markAsRead({
        businessId: validBusinessId,
        notificationId: validNotificationId,
      });

      assert.equal(result.id, validNotificationId);
      assert.ok(result.readAt);
      assert.doesNotThrow(() => new Date(result.readAt).toISOString());
    });

    it('markAllAsRead returns updated count', async () => {
      const result = await service.markAllAsRead({
        businessId: validBusinessId,
      });

      assert.equal(typeof result.count, 'number');
      assert.ok(result.count >= 0);
    });
  });
});
