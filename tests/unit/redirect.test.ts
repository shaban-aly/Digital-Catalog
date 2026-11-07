import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeRedirectUrl } from '../../src/client/utils/redirect.ts';

describe('Open Redirect Sanitizer (sanitizeRedirectUrl)', () => {
  it('returns valid relative paths as-is', () => {
    assert.equal(sanitizeRedirectUrl('/dashboard'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('/dashboard/products'), '/dashboard/products');
    assert.equal(sanitizeRedirectUrl('/_admin/settings'), '/_admin/settings');
    assert.equal(sanitizeRedirectUrl('/onboarding?step=2'), '/onboarding?step=2');
  });

  it('neutralizes external absolute URLs and falls back to /dashboard', () => {
    assert.equal(sanitizeRedirectUrl('https://evil-phishing.com'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('http://attacker.com/steal-creds'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('ftp://evil.com'), '/dashboard');
  });

  it('neutralizes protocol-relative URLs (//evil.com)', () => {
    assert.equal(sanitizeRedirectUrl('//evil.com'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('//evil.com/phish'), '/dashboard');
  });

  it('neutralizes URLs with backslashes', () => {
    assert.equal(sanitizeRedirectUrl('\\evil.com'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('/\\evil.com'), '/dashboard');
  });

  it('neutralizes dangerous URI schemes (javascript:, data:)', () => {
    assert.equal(sanitizeRedirectUrl('javascript:alert(1)'), '/dashboard');
    assert.equal(sanitizeRedirectUrl('data:text/html,<script>evil()</script>'), '/dashboard');
  });

  it('handles empty, null, undefined, and non-string inputs safely', () => {
    assert.equal(sanitizeRedirectUrl(null), '/dashboard');
    assert.equal(sanitizeRedirectUrl(undefined), '/dashboard');
    assert.equal(sanitizeRedirectUrl(''), '/dashboard');
    assert.equal(sanitizeRedirectUrl('   '), '/dashboard');
  });

  it('respects custom fallback destination when supplied', () => {
    assert.equal(sanitizeRedirectUrl('https://evil.com', '/custom-fallback'), '/custom-fallback');
    assert.equal(sanitizeRedirectUrl(null, '/login'), '/login');
  });
});
