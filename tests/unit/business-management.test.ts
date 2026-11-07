import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSlugFormat,
  isReservedSlug,
  normalizeSlug,
  SLUG_REGEX,
  RESERVED_SLUGS,
} from '../../src/client/utils/slug-validator.ts';
import { businessService } from '../../src/server/services/business.ts';

describe('Subdomain Slug Validator (BIZ-001 / DNS RFC 1123)', () => {
  describe('Valid Subdomain Slugs', () => {
    it('accepts standard lowercase alphanumeric slugs', () => {
      const validSlugs = ['shawarma', 'store123', 'burger99', 'cafe-alex', 'suez-market-online'];
      for (const slug of validSlugs) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, true, `Expected "${slug}" to be valid`);
        assert.equal(result.error, undefined);
      }
    });

    it('accepts minimum 3-character slugs', () => {
      const result = validateSlugFormat('abc');
      assert.equal(result.valid, true);
    });

    it('accepts maximum 63-character slugs', () => {
      const maxSlug = 'a'.repeat(63);
      const result = validateSlugFormat(maxSlug);
      assert.equal(result.valid, true);
    });

    it('matches SLUG_REGEX for valid DNS labels', () => {
      assert.equal(SLUG_REGEX.test('shawarma-corner'), true);
      assert.equal(SLUG_REGEX.test('a1-b2-c3'), true);
    });
  });

  describe('Invalid Subdomain Slugs (Format Constraints)', () => {
    it('rejects empty or whitespace-only inputs', () => {
      const emptyResult = validateSlugFormat('');
      assert.equal(emptyResult.valid, false);
      assert.match(emptyResult.error || '', /يرجى إدخال الرابط/);

      const spaceResult = validateSlugFormat('   ');
      assert.equal(spaceResult.valid, false);
    });

    it('rejects slugs shorter than 3 characters', () => {
      const shortSlugs = ['a', 'ab', '1', '12', 'x-'];
      for (const slug of shortSlugs) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, false, `Expected "${slug}" to be rejected for length`);
        assert.match(result.error || '', /قصير جداً/);
      }
    });

    it('rejects slugs longer than 63 characters', () => {
      const longSlug = 'a'.repeat(64);
      const result = validateSlugFormat(longSlug);
      assert.equal(result.valid, false);
      assert.match(result.error || '', /طويل جداً/);
    });

    it('rejects consecutive hyphens (-- / Punycode conflict)', () => {
      const doubleHyphenSlugs = ['best--burgers', 'my--store--app', 'xn--cafe'];
      for (const slug of doubleHyphenSlugs) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, false, `Expected "${slug}" with double hyphens to be rejected`);
        assert.match(result.error || '', /شرطتين متتاليتين/);
      }
    });

    it('rejects leading or trailing hyphens', () => {
      const invalidLeadingTrailing = ['-shawarma', 'shawarma-', '-shawarma-'];
      for (const slug of invalidLeadingTrailing) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, false, `Expected "${slug}" to be rejected`);
        assert.match(result.error || '', /شرطة/);
      }
    });

    it('rejects spaces, uppercase, and special characters', () => {
      const invalidChars = [
        'store name',
        'store_name',
        'store!name',
        'store@suez',
        'store#1',
        'store.alex',
      ];
      for (const slug of invalidChars) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, false, `Expected "${slug}" to be rejected`);
      }
    });

    it('rejects Arabic script in domain slugs', () => {
      const arabicSlugs = ['شاورما', 'مطعم-البركة', 'كافيه123'];
      for (const slug of arabicSlugs) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, false, `Expected Arabic slug "${slug}" to be rejected for DNS label`);
      }
    });
  });

  describe('Reserved Platform Slugs Check', () => {
    it('detects reserved system subdomains accurately', () => {
      for (const slug of ['admin', 'api', 'support', 'billing', 'digitalmenu', 'suez', 'dashboard']) {
        assert.equal(isReservedSlug(slug), true, `Expected "${slug}" to be recognized as reserved`);
      }
    });

    it('rejects registration of reserved system subdomains', () => {
      for (const slug of RESERVED_SLUGS) {
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, false, `Expected reserved slug "${slug}" to be rejected`);
        assert.match(result.error || '', /محجوز للمنصة/);
      }
    });

    it('permits non-reserved subdomains with similar roots', () => {
      const allowed = ['admin-burger', 'api-solutions', 'support-desk'];
      for (const slug of allowed) {
        assert.equal(isReservedSlug(slug), false);
        const result = validateSlugFormat(slug);
        assert.equal(result.valid, true);
      }
    });
  });

  describe('Slug Normalizer (normalizeSlug)', () => {
    it('converts mixed strings into clean DNS slug candidates', () => {
      assert.equal(normalizeSlug('Al Fanoos Cafe 2026'), 'al-fanoos-cafe-2026');
      assert.equal(normalizeSlug('   Shawarma & Burgers!   '), 'shawarma-burgers');
      assert.equal(normalizeSlug('Special---Offers'), 'special-offers');
      assert.equal(normalizeSlug('--leading-and-trailing--'), 'leading-and-trailing');
    });

    it('handles empty and undefined inputs gracefully', () => {
      assert.equal(normalizeSlug(''), '');
      assert.equal(normalizeSlug(undefined as unknown as string), '');
    });
  });

  describe('BusinessService: checkSlugAvailability', () => {
    it('rejects reserved platform slugs through checkSlugAvailability', async () => {
      const result = await businessService.checkSlugAvailability('admin');
      assert.equal(result.available, false);
      assert.match(result.reason || '', /محجوز للمنصة/);
    });

    it('rejects short slugs through checkSlugAvailability', async () => {
      const result = await businessService.checkSlugAvailability('ab');
      assert.equal(result.available, false);
      assert.match(result.reason || '', /قصير جداً/);
    });

    it('rejects double hyphens through checkSlugAvailability', async () => {
      const result = await businessService.checkSlugAvailability('shawarma--alex');
      assert.equal(result.available, false);
      assert.match(result.reason || '', /شرطتين متتاليتين/);
    });

    it('returns available for valid formatted non-reserved slug', async () => {
      const result = await businessService.checkSlugAvailability('fresh-shawarma-alex');
      assert.equal(result.available, true);
    });
  });
});
