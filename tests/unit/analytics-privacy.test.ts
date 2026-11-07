import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LogQrScanEventSchema,
  AnalyticsSummarySchema,
  GetBusinessMetricsQuerySchema,
} from '../../src/shared/schemas.ts';
import {
  isCrawlerOrBot,
  generatePrivacyFingerprint,
  truncateIpSubnet,
} from '../../src/server/services/analytics.ts';

describe('Privacy-Safe Analytics (ANL-001)', () => {
  const validQrId = '123e4567-e89b-12d3-a456-426614174000';
  const validBusinessId = 'b0000000-0000-4000-8000-000000000001';

  describe('truncateIpSubnet (Subnet Masking)', () => {
    it('truncates IPv4 to /24 subnet', () => {
      assert.equal(truncateIpSubnet('197.38.12.89'), '197.38.12.0');
      assert.equal(truncateIpSubnet('10.0.1.254'), '10.0.1.0');
    });

    it('truncates IPv6 to /48 subnet', () => {
      assert.equal(
        truncateIpSubnet('2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
        '2001:0db8:85a3::'
      );
    });

    it('handles empty IP safely', () => {
      assert.equal(truncateIpSubnet(''), '0.0.0.0');
    });
  });

  describe('isCrawlerOrBot Classifier', () => {
    it('detects WhatsApp preview bot accurately', () => {
      assert.equal(isCrawlerOrBot('WhatsApp/2.21.10.15 i'), true);
      assert.equal(isCrawlerOrBot('WhatsApp/2.20.198.15 A'), true);
    });

    it('detects major search engine and social crawlers', () => {
      assert.equal(isCrawlerOrBot('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'), true);
      assert.equal(isCrawlerOrBot('Twitterbot/1.0'), true);
      assert.equal(isCrawlerOrBot('Googlebot/2.1 (+http://www.google.com/bot.html)'), true);
      assert.equal(isCrawlerOrBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'), true);
      assert.equal(isCrawlerOrBot('TelegramBot (like TwitterBot)'), true);
      assert.equal(isCrawlerOrBot('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/90.0'), true);
    });

    it('classifies empty or undefined user-agent as bot', () => {
      assert.equal(isCrawlerOrBot(''), true);
      assert.equal(isCrawlerOrBot(undefined as any), true);
    });

    it('allows genuine mobile browser user-agents (human diners)', () => {
      const iphoneSafari =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
      assert.equal(isCrawlerOrBot(iphoneSafari), false);

      const androidChrome =
        'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
      assert.equal(isCrawlerOrBot(androidChrome), false);
    });
  });

  describe('generatePrivacyFingerprint (GDPR Subnet & Rotating Salt)', () => {
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)';

    it('produces a 64-character hex SHA-256 string', async () => {
      const hash = await generatePrivacyFingerprint('197.38.12.89', userAgent, 'test-secret');
      assert.equal(hash.length, 64);
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('truncates IPv4 to /24 subnet so devices on same subnet share fingerprint', async () => {
      const hash1 = await generatePrivacyFingerprint('197.38.12.10', userAgent, 'test-secret');
      const hash2 = await generatePrivacyFingerprint('197.38.12.99', userAgent, 'test-secret');
      assert.equal(hash1, hash2);
    });

    it('produces different fingerprints for different subnets', async () => {
      const hash1 = await generatePrivacyFingerprint('197.38.12.10', userAgent, 'test-secret');
      const hash2 = await generatePrivacyFingerprint('197.38.15.10', userAgent, 'test-secret');
      assert.notEqual(hash1, hash2);
    });

    it('handles IPv6 addresses with /48 truncation', async () => {
      const hash = await generatePrivacyFingerprint('2001:0db8:85a3:0000:0000:8a2e:0370:7334', userAgent, 'test-secret');
      assert.equal(hash.length, 64);
    });

    it('diverges when secret key changes', async () => {
      const hashA = await generatePrivacyFingerprint('197.38.12.89', userAgent, 'secret-day-1');
      const hashB = await generatePrivacyFingerprint('197.38.12.89', userAgent, 'secret-day-2');
      assert.notEqual(hashA, hashB);
    });
  });

  describe('LogQrScanEventSchema Validation', () => {
    it('accepts valid QR scan telemetry input', () => {
      const input = {
        qrCodeId: validQrId,
        ipAddress: '197.38.12.89',
        userAgent: 'Mozilla/5.0 iPhone',
        referrer: 'https://wa.me/',
      };
      const result = LogQrScanEventSchema.parse(input);
      assert.equal(result.qrCodeId, validQrId);
      assert.equal(result.ipAddress, '197.38.12.89');
    });

    it('rejects invalid qrCodeId UUID', () => {
      assert.throws(
        () =>
          LogQrScanEventSchema.parse({
            qrCodeId: 'invalid-uuid',
            ipAddress: '197.38.12.89',
          }),
        /معرف رمز QR يجب أن يكون UUID صالح/
      );
    });

    it('rejects empty ipAddress', () => {
      assert.throws(
        () =>
          LogQrScanEventSchema.parse({
            qrCodeId: validQrId,
            ipAddress: '',
          }),
        /عنوان IP مطلوب/
      );
    });
  });

  describe('AnalyticsSummarySchema Validation', () => {
    it('accepts valid aggregate business engagement metrics', () => {
      const summary = {
        totalScans: 120,
        totalViews: 168,
        totalWhatsAppClicks: 26,
        uniqueVisitorsEstimate: 95,
      };
      const result = AnalyticsSummarySchema.parse(summary);
      assert.equal(result.totalScans, 120);
      assert.equal(result.uniqueVisitorsEstimate, 95);
    });

    it('rejects negative metric numbers', () => {
      assert.throws(() =>
        AnalyticsSummarySchema.parse({
          totalScans: -5,
          totalViews: 0,
          totalWhatsAppClicks: 0,
          uniqueVisitorsEstimate: 0,
        })
      );
    });
  });

  describe('GetBusinessMetricsQuerySchema Validation', () => {
    it('accepts valid UUID businessId', () => {
      const res = GetBusinessMetricsQuerySchema.parse({ businessId: validBusinessId });
      assert.equal(res.businessId, validBusinessId);
    });

    it('rejects invalid UUID businessId', () => {
      assert.throws(
        () => GetBusinessMetricsQuerySchema.parse({ businessId: 'bad-id' }),
        /معرف المتجر يجب أن يكون UUID صالح/
      );
    });
  });
});

