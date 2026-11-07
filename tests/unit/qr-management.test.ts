import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CreateQRCodeSchema,
  ResolveShortCodeSchema,
  QRCodeRecordSchema,
} from '../../src/shared/schemas.ts';
import { generateShortCode } from '../../src/server/services/qr.ts';
import { handleQrRedirect } from '../../src/server/routes/q.$shortCode.ts';

describe('QR Code Management (QR-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';
  const validCatalogId = 'c0000000-0000-4000-8000-000000000001';

  describe('generateShortCode (Base32 Unambiguous Charset)', () => {
    const BASE32_CHARSET = '23456789abcdefghjkmnpqrstuvwxyz';

    it('generates a 6-character code by default', () => {
      const code = generateShortCode();
      assert.equal(code.length, 6);
    });

    it('respects requested custom length', () => {
      const code8 = generateShortCode(8);
      assert.equal(code8.length, 8);

      const code10 = generateShortCode(10);
      assert.equal(code10.length, 10);
    });

    it('contains only characters from the unambiguous Base32 charset', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateShortCode(6);
        for (const ch of code) {
          assert.ok(
            BASE32_CHARSET.includes(ch),
            `Character "${ch}" is not in Base32 charset`
          );
        }
      }
    });

    it('never contains easily confused characters (0, 1, l, o)', () => {
      const forbidden = ['0', '1', 'l', 'o', 'I', 'O'];
      for (let i = 0; i < 50; i++) {
        const code = generateShortCode(6);
        for (const bad of forbidden) {
          assert.ok(
            !code.includes(bad),
            `Generated code "${code}" contained forbidden ambiguous character "${bad}"`
          );
        }
      }
    });

    it('generates diverse codes without immediate collision', () => {
      const set = new Set<string>();
      for (let i = 0; i < 100; i++) {
        set.add(generateShortCode(6));
      }
      assert.equal(set.size, 100);
    });
  });

  describe('CreateQRCodeSchema Validation', () => {
    it('accepts valid businessId and catalogId', () => {
      const input = {
        businessId: validBusinessId,
        catalogId: validCatalogId,
      };
      const result = CreateQRCodeSchema.parse(input);
      assert.equal(result.businessId, validBusinessId);
      assert.equal(result.catalogId, validCatalogId);
    });

    it('accepts businessId when catalogId is omitted', () => {
      const input = { businessId: validBusinessId };
      const result = CreateQRCodeSchema.parse(input);
      assert.equal(result.businessId, validBusinessId);
      assert.equal(result.catalogId, undefined);
    });

    it('rejects invalid businessId UUID', () => {
      assert.throws(
        () => CreateQRCodeSchema.parse({ businessId: 'not-a-uuid' }),
        /معرف المتجر يجب أن يكون UUID صالح/
      );
    });

    it('rejects invalid catalogId UUID', () => {
      assert.throws(
        () =>
          CreateQRCodeSchema.parse({
            businessId: validBusinessId,
            catalogId: 'not-a-uuid',
          }),
        /معرف القائمة يجب أن يكون UUID صالح/
      );
    });
  });

  describe('ResolveShortCodeSchema Validation', () => {
    it('accepts valid 6-char short code', () => {
      const input = { shortCode: '7x9m2p' };
      const result = ResolveShortCodeSchema.parse(input);
      assert.equal(result.shortCode, '7x9m2p');
    });

    it('rejects short codes shorter than 4 characters', () => {
      assert.throws(
        () => ResolveShortCodeSchema.parse({ shortCode: 'abc' }),
        /رمز QR قصير جداً/
      );
    });

    it('rejects short codes longer than 32 characters', () => {
      assert.throws(
        () => ResolveShortCodeSchema.parse({ shortCode: 'a'.repeat(33) }),
        /رمز QR طويل جداً/
      );
    });

    it('rejects invalid characters in short code', () => {
      assert.throws(
        () => ResolveShortCodeSchema.parse({ shortCode: 'bad code!' }),
        /رمز QR يحتوي على أحرف غير صالحة/
      );
    });
  });

  describe('QRCodeRecordSchema Validation', () => {
    it('accepts complete QR record', () => {
      const record = {
        id: '20000000-0000-4000-8000-000000000001',
        business_id: validBusinessId,
        catalog_id: validCatalogId,
        short_code: '8k4z3w',
        is_active: true,
        total_scans: 142,
        created_at: new Date().toISOString(),
        redirect_url: 'https://digitalmenu.daleel-al-suez.com/q/8k4z3w',
      };
      const parsed = QRCodeRecordSchema.parse(record);
      assert.equal(parsed.short_code, '8k4z3w');
      assert.equal(parsed.total_scans, 142);
    });
  });

  describe('handleQrRedirect Edge Response Handling', () => {
    it('returns 404 with Arabic explanation when short code does not exist', async () => {
      const request = new Request('https://digitalmenu.daleel-al-suez.com/q/nonexistent99');
      const response = await handleQrRedirect(request, 'nonexistent99');

      assert.equal(response.status, 404);
      assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');

      const html = await response.text();
      assert.ok(html.includes('رمز الاستجابة السريعة (QR) غير متاح أو تم إيقافه'));
      assert.ok(html.includes('dir="rtl"'));
    });
  });
});

