import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogService } from '../../src/server/services/audit-log.ts';
import {
  AuditActionSchema,
  AuditTargetTypeSchema,
  RecordAuditSchema,
  ListAuditLogsQuerySchema,
} from '../../src/shared/schemas.ts';

describe('Audit Logs & Governance History (AUD-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';
  const validActorId = 'a0000000-0000-4000-8000-000000000001';
  const validTargetId = 'b0000000-0000-4000-8000-000000000002';
  const service = new AuditLogService();

  describe('Role-Based Authorization Gate', () => {
    it('grants access to owner, admin, and super_admin', () => {
      assert.equal(service.canViewAuditLogs('owner'), true);
      assert.equal(service.canViewAuditLogs('admin'), true);
      assert.equal(service.canViewAuditLogs('super_admin'), true);
    });

    it('denies access to editor and viewer roles', () => {
      assert.equal(service.canViewAuditLogs('editor'), false);
      assert.equal(service.canViewAuditLogs('viewer'), false);
    });

    it('denies access for empty or invalid roles', () => {
      assert.equal(service.canViewAuditLogs(''), false);
      // @ts-expect-error test invalid type
      assert.equal(service.canViewAuditLogs(null), false);
    });

    it('assertCanViewAuditLogs passes for authorized roles', () => {
      assert.doesNotThrow(() => {
        service.assertCanViewAuditLogs('owner');
        service.assertCanViewAuditLogs('admin');
      });
    });

    it('assertCanViewAuditLogs throws Arabic 403 Forbidden for unprivileged roles', () => {
      assert.throws(
        () => {
          service.assertCanViewAuditLogs('editor');
        },
        {
          name: 'Error',
          message: /غير مصرح لك باستعراض سجلات الرقابة والتدقيق/,
        }
      );

      assert.throws(
        () => {
          service.assertCanViewAuditLogs('viewer');
        },
        {
          name: 'Error',
          message: /غير مصرح لك باستعراض سجلات الرقابة والتدقيق/,
        }
      );
    });
  });

  describe('AuditAction & AuditTargetType Schema Validation', () => {
    it('accepts all 6 standard audit action types', () => {
      const actions = [
        'tenant_role_changed',
        'tenant_member_removed',
        'store_status_changed',
        'subscription_tier_updated',
        'catalog_lifecycle_changed',
        'business_profile_updated',
      ] as const;

      for (const action of actions) {
        assert.equal(AuditActionSchema.parse(action), action);
      }
    });

    it('rejects unapproved audit action', () => {
      assert.throws(() => {
        AuditActionSchema.parse('unauthorized_secret_action');
      });
    });

    it('accepts all 5 target types', () => {
      const targets = ['member', 'business', 'catalog', 'subscription', 'product'] as const;
      for (const target of targets) {
        assert.equal(AuditTargetTypeSchema.parse(target), target);
      }
    });

    it('rejects unknown target type', () => {
      assert.throws(() => {
        AuditTargetTypeSchema.parse('unknown_entity');
      });
    });
  });

  describe('RecordAuditSchema Validation', () => {
    it('accepts valid audit event payload', () => {
      const payload = {
        businessId: validBusinessId,
        actorId: validActorId,
        actorRole: 'owner',
        action: 'tenant_role_changed' as const,
        targetType: 'member' as const,
        targetId: validTargetId,
        details: {
          previousRole: 'editor',
          newRole: 'admin',
        },
        ipAddress: '197.34.120.15',
      };

      const parsed = RecordAuditSchema.parse(payload);
      assert.equal(parsed.businessId, validBusinessId);
      assert.equal(parsed.action, 'tenant_role_changed');
      assert.equal(parsed.targetType, 'member');
      assert.equal(parsed.targetId, validTargetId);
      assert.deepEqual(parsed.details, payload.details);
    });

    it('rejects invalid businessId UUID', () => {
      assert.throws(
        () => {
          RecordAuditSchema.parse({
            businessId: 'invalid-uuid-string',
            action: 'store_status_changed',
            targetType: 'business',
            targetId: validTargetId,
          });
        },
        {
          message: /UUID صالح/,
        }
      );
    });

    it('rejects empty targetId', () => {
      assert.throws(() => {
        RecordAuditSchema.parse({
          businessId: validBusinessId,
          action: 'store_status_changed',
          targetType: 'business',
          targetId: '',
        });
      });
    });
  });

  describe('ListAuditLogsQuerySchema Validation', () => {
    it('applies default pagination values (page 1, limit 20)', () => {
      const parsed = ListAuditLogsQuerySchema.parse({
        businessId: validBusinessId,
      });

      assert.equal(parsed.page, 1);
      assert.equal(parsed.limit, 20);
    });

    it('accepts valid action and target filters', () => {
      const parsed = ListAuditLogsQuerySchema.parse({
        businessId: validBusinessId,
        action: 'subscription_tier_updated',
        targetType: 'subscription',
        page: 2,
        limit: 50,
      });

      assert.equal(parsed.action, 'subscription_tier_updated');
      assert.equal(parsed.targetType, 'subscription');
      assert.equal(parsed.page, 2);
      assert.equal(parsed.limit, 50);
    });

    it('rejects limit exceeding 100', () => {
      assert.throws(() => {
        ListAuditLogsQuerySchema.parse({
          businessId: validBusinessId,
          limit: 150,
        });
      });
    });

    it('rejects non-positive page', () => {
      assert.throws(() => {
        ListAuditLogsQuerySchema.parse({
          businessId: validBusinessId,
          page: 0,
        });
      });
    });
  });

  describe('AuditLogService Operations & Non-Blocking Logging', () => {
    it('recordEvent appends event and returns populated record', async () => {
      const record = await service.recordEvent({
        businessId: validBusinessId,
        actorId: validActorId,
        actorRole: 'owner',
        action: 'store_status_changed',
        targetType: 'business',
        targetId: validBusinessId,
        details: {
          previousStatus: 'active',
          newStatus: 'suspended',
          reason: 'صيانة دورية',
        },
      });

      assert.ok(record.id);
      assert.equal(record.businessId, validBusinessId);
      assert.equal(record.action, 'store_status_changed');
      assert.equal(record.targetType, 'business');
      assert.ok(record.createdAt);
    });

    it('listLogs succeeds for store owner and returns paginated result', async () => {
      const result = await service.listLogs(validActorId, 'owner', {
        businessId: validBusinessId,
        page: 1,
        limit: 10,
      });

      assert.equal(result.page, 1);
      assert.equal(result.limit, 10);
      assert.ok(Array.isArray(result.logs));
      assert.equal(typeof result.total, 'number');
    });

    it('listLogs rejects unprivileged editor with Arabic 403 Forbidden', async () => {
      await assert.rejects(
        async () => {
          await service.listLogs(validActorId, 'editor', {
            businessId: validBusinessId,
          });
        },
        {
          name: 'Error',
          message: /غير مصرح لك باستعراض سجلات الرقابة والتدقيق/,
        }
      );
    });
  });
});
