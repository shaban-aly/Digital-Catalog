import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CustomDomainService } from '../../src/server/services/custom-domain.ts';
import {
  HostnameSchema,
  RegisterCustomDomainSchema,
  VerifyCustomDomainSchema,
  DeleteCustomDomainSchema,
} from '../../src/shared/schemas.ts';

describe('External Custom Domains (DOM-002)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';
  const validDomainId = 'a0000000-0000-4000-8000-000000000001';
  const service = new CustomDomainService();

  describe('Hostname RFC 1123 Syntax Validation', () => {
    it('accepts valid custom domain hostnames', () => {
      assert.equal(HostnameSchema.parse('menu.albaraka.com'), 'menu.albaraka.com');
      assert.equal(HostnameSchema.parse('orders.suez-cafe.net'), 'orders.suez-cafe.net');
      assert.equal(HostnameSchema.parse('albaraka.eg'), 'albaraka.eg');
    });

    it('converts uppercase domain inputs to lowercase', () => {
      assert.equal(HostnameSchema.parse('MENU.ALBARAKA.COM'), 'menu.albaraka.com');
    });

    it('rejects URL scheme prefixes (http:// and https://)', () => {
      assert.throws(
        () => {
          HostnameSchema.parse('https://menu.albaraka.com');
        },
        {
          message: /بروتوكول مثل http:\/\/ أو https:\/\//,
        }
      );
    });

    it('rejects paths and trailing slashes', () => {
      assert.throws(
        () => {
          HostnameSchema.parse('menu.albaraka.com/catalog');
        },
        {
          message: /مسارات/,
        }
      );
    });

    it('rejects port numbers', () => {
      assert.throws(
        () => {
          HostnameSchema.parse('menu.albaraka.com:8080');
        },
        {
          message: /منفذ \(port\)/,
        }
      );
    });

    it('rejects invalid TLD or incomplete hostnames', () => {
      assert.throws(() => {
        HostnameSchema.parse('invalid_domain_without_tld');
      });
    });
  });

  describe('Platform Domain & Namespace Shield', () => {
    it('identifies platform domains and subdomains accurately', () => {
      assert.equal(service.isPlatformDomain('al-baraka.digitalmenu.daleel-al-suez.com'), true);
      assert.equal(service.isPlatformDomain('daleel-al-suez.com'), true);
      assert.equal(service.isPlatformDomain('admin.digitalmenu.com'), true);
      assert.equal(service.isPlatformDomain('menu.independent-restaurant.com'), false);
    });

    it('rejects attempts to register platform-owned domain names', async () => {
      await assert.rejects(
        async () => {
          await service.registerCustomDomain({
            businessId: validBusinessId,
            hostname: 'custom.digitalmenu.daleel-al-suez.com',
            planCode: 'pro',
          });
        },
        {
          name: 'Error',
          message: /لا يمكن تسجيل نطاقات المنصة كنطاقات خاصة خارجية/,
        }
      );
    });
  });

  describe('Pro Tier Entitlement Guard', () => {
    it('rejects custom domain registration for Free tier stores', async () => {
      await assert.rejects(
        async () => {
          await service.registerCustomDomain({
            businessId: validBusinessId,
            hostname: 'menu.free-store.com',
            planCode: 'free',
          });
        },
        {
          name: 'Error',
          message: /متاحة حصرياً لمشتركي باقة برو Pro/,
        }
      );
    });

    it('permits custom domain registration for Pro and Enterprise stores', async () => {
      const record = await service.registerCustomDomain({
        businessId: validBusinessId,
        hostname: 'menu.pro-restaurant.com',
        planCode: 'pro',
      });

      assert.ok(record.id);
      assert.equal(record.status, 'pending_verification');
      assert.ok(record.verificationToken.startsWith('dm_verify_'));
      assert.equal(record.txtChallengeHost, '_digitalmenu-challenge.menu.pro-restaurant.com');
      assert.equal(record.cnameTarget, 'custom.digitalmenu.daleel-al-suez.com');
    });
  });

  describe('Verification & Edge Resolution Operations', () => {
    it('verifyCustomDomain updates domain to active state with verified timestamp', async () => {
      const record = await service.verifyCustomDomain({
        businessId: validBusinessId,
        domainId: validDomainId,
      });

      assert.equal(record.id, validDomainId);
      assert.equal(record.status, 'active');
      assert.ok(record.verifiedAt);
    });

    it('resolveCustomDomain returns not_found for unknown domains', async () => {
      const result = await service.resolveCustomDomain('unregistered-random-store.com');
      assert.equal(result.status, 'not_found');
      assert.equal(result.hostname, 'unregistered-random-store.com');
    });

    it('deleteCustomDomain unlinks and returns deletion confirmation', async () => {
      const result = await service.deleteCustomDomain({
        businessId: validBusinessId,
        domainId: validDomainId,
      });

      assert.equal(result.id, validDomainId);
      assert.equal(result.deleted, true);
    });
  });

  describe('Custom Domain Schema Validations', () => {
    it('validates RegisterCustomDomainSchema with RFC 4122 UUID', () => {
      const parsed = RegisterCustomDomainSchema.parse({
        businessId: validBusinessId,
        hostname: 'menu.suez-diner.com',
        planCode: 'pro',
      });
      assert.equal(parsed.businessId, validBusinessId);
      assert.equal(parsed.hostname, 'menu.suez-diner.com');
    });

    it('validates VerifyCustomDomainSchema', () => {
      const parsed = VerifyCustomDomainSchema.parse({
        businessId: validBusinessId,
        domainId: validDomainId,
      });
      assert.equal(parsed.domainId, validDomainId);
    });

    it('validates DeleteCustomDomainSchema', () => {
      const parsed = DeleteCustomDomainSchema.parse({
        businessId: validBusinessId,
        domainId: validDomainId,
      });
      assert.equal(parsed.domainId, validDomainId);
    });
  });
});
