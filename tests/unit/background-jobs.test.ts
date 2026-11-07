import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BackgroundJobsService } from '../../src/server/services/background-jobs.ts';
import {
  BackgroundJobNameSchema,
  JobResultSchema,
  RunJobSchema,
} from '../../src/shared/schemas.ts';

describe('Background Jobs & Data Retention (JOB-001)', () => {
  const testSecret = 'secret_test_cron_token_12345';
  const service = new BackgroundJobsService({ cronSecret: testSecret });

  describe('Bearer Token Authorization Guard (CRON_SECRET)', () => {
    it('accepts correct Bearer authorization header', () => {
      const isValid = service.verifyCronSecret(`Bearer ${testSecret}`);
      assert.equal(isValid, true);
    });

    it('rejects incorrect Bearer token', () => {
      assert.equal(service.verifyCronSecret('Bearer wrong_token'), false);
    });

    it('rejects missing or malformed authorization header', () => {
      assert.equal(service.verifyCronSecret(''), false);
      assert.equal(service.verifyCronSecret('Basic xyz123'), false);
      // @ts-expect-error test invalid type
      assert.equal(service.verifyCronSecret(null), false);
    });

    it('assertCronAuthorized succeeds for valid secret', () => {
      assert.doesNotThrow(() => {
        service.assertCronAuthorized(`Bearer ${testSecret}`);
      });
    });

    it('assertCronAuthorized throws Arabic 401 Unauthorized for invalid secret', () => {
      assert.throws(
        () => {
          service.assertCronAuthorized('Bearer invalid');
        },
        {
          name: 'Error',
          message: /غير مصرح لك بتشغيل مهام الصيانة المجدولة/,
        }
      );
    });
  });

  describe('BackgroundJobNameSchema & JobResultSchema Validation', () => {
    it('accepts all 3 approved background job names', () => {
      assert.equal(BackgroundJobNameSchema.parse('compact_analytics'), 'compact_analytics');
      assert.equal(BackgroundJobNameSchema.parse('prune_notifications'), 'prune_notifications');
      assert.equal(BackgroundJobNameSchema.parse('check_subscriptions'), 'check_subscriptions');
    });

    it('rejects unapproved job names', () => {
      assert.throws(() => {
        BackgroundJobNameSchema.parse('delete_all_users');
      });
    });

    it('validates JobResultSchema successfully', () => {
      const validResult = {
        jobName: 'compact_analytics' as const,
        status: 'completed' as const,
        recordsProcessed: 150,
        durationMs: 45,
      };

      const parsed = JobResultSchema.parse(validResult);
      assert.deepEqual(parsed, validResult);
    });

    it('rejects negative recordsProcessed or durationMs in JobResult', () => {
      assert.throws(() => {
        JobResultSchema.parse({
          jobName: 'compact_analytics',
          status: 'completed',
          recordsProcessed: -5,
          durationMs: 10,
        });
      });

      assert.throws(() => {
        JobResultSchema.parse({
          jobName: 'compact_analytics',
          status: 'completed',
          recordsProcessed: 10,
          durationMs: -1,
        });
      });
    });
  });

  describe('RunJobSchema Validation', () => {
    it('applies default retentionDays (30) and dryRun (false)', () => {
      const parsed = RunJobSchema.parse({
        jobName: 'compact_analytics',
      });

      assert.equal(parsed.retentionDays, 30);
      assert.equal(parsed.dryRun, false);
    });

    it('rejects non-positive retentionDays', () => {
      assert.throws(() => {
        RunJobSchema.parse({
          jobName: 'compact_analytics',
          retentionDays: 0,
        });
      });

      assert.throws(() => {
        RunJobSchema.parse({
          jobName: 'compact_analytics',
          retentionDays: -10,
        });
      });
    });
  });

  describe('BackgroundJobsService Maintenance Execution', () => {
    it('compactAnalytics executes and returns structured completed result', async () => {
      const result = await service.compactAnalytics({ retentionDays: 30 });
      assert.equal(result.jobName, 'compact_analytics');
      assert.equal(result.status, 'completed');
      assert.equal(typeof result.recordsProcessed, 'number');
      assert.equal(typeof result.durationMs, 'number');
      assert.ok(result.durationMs >= 0);
    });

    it('pruneReadNotifications executes and returns structured completed result', async () => {
      const result = await service.pruneReadNotifications({ retentionDays: 90 });
      assert.equal(result.jobName, 'prune_notifications');
      assert.equal(result.status, 'completed');
      assert.equal(typeof result.recordsProcessed, 'number');
      assert.equal(typeof result.durationMs, 'number');
      assert.ok(result.durationMs >= 0);
    });

    it('checkSubscriptionExpirations executes and returns structured completed result', async () => {
      const result = await service.checkSubscriptionExpirations();
      assert.equal(result.jobName, 'check_subscriptions');
      assert.equal(result.status, 'completed');
      assert.equal(typeof result.recordsProcessed, 'number');
      assert.equal(typeof result.durationMs, 'number');
      assert.ok(result.durationMs >= 0);
    });

    it('runMaintenanceBatch executes all 3 jobs sequentially', async () => {
      const results = await service.runMaintenanceBatch();
      assert.equal(results.length, 3);
      assert.equal(results[0].jobName, 'compact_analytics');
      assert.equal(results[1].jobName, 'prune_notifications');
      assert.equal(results[2].jobName, 'check_subscriptions');

      for (const res of results) {
        assert.equal(res.status, 'completed');
        assert.ok(res.durationMs >= 0);
      }
    });
  });
});
