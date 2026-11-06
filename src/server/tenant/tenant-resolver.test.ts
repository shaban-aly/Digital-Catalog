import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TenantResolver } from './resolver.ts';

describe('TenantResolver', () => {
  const resolver = new TenantResolver('digitalmenu.daleel-al-suez.com', 'digitalmenu.daleel-al-suez.com', 'daleel-al-suez.com');

  it('recognizes main platform domain', () => {
    const res = resolver.resolve(new URL('https://digitalmenu.daleel-al-suez.com/'));
    assert.equal(res.isPlatformRoot, true);
    assert.equal(res.isTenantSubdomain, false);
    assert.equal(res.tenantSlug, null);
  });

  it('recognizes localhost and 127.0.0.1 as platform root in dev', () => {
    const resLocal = resolver.resolve(new URL('http://localhost:5173/dashboard'));
    assert.equal(resLocal.isPlatformRoot, true);
    assert.equal(resLocal.isTenantSubdomain, false);

    const resIp = resolver.resolve(new URL('http://127.0.0.1:8787/'));
    assert.equal(resIp.isPlatformRoot, true);
  });

  it('recognizes workers.dev deployment host as platform root', () => {
    const res = resolver.resolve(new URL('https://digital-catalog.shabanaly1997.workers.dev/'));
    assert.equal(res.isPlatformRoot, true);
    assert.equal(res.isTenantSubdomain, false);
  });

  it('correctly resolves a valid tenant platform subdomain ({slug}.digitalmenu.daleel-al-suez.com)', () => {
    const res = resolver.resolve(new URL('https://ahmed-cafe.digitalmenu.daleel-al-suez.com/'));
    assert.equal(res.isTenantSubdomain, true);
    assert.equal(res.tenantSlug, 'ahmed-cafe');
    assert.equal(res.isPlatformRoot, false);
    assert.equal(res.isReserved, false);
  });

  it('normalizes uppercase hostnames to lowercase', () => {
    const res = resolver.resolve(new URL('https://Ahmed-Cafe.DigitalMenu.Daleel-Al-Suez.com/item/123'));
    assert.equal(res.isTenantSubdomain, true);
    assert.equal(res.tenantSlug, 'ahmed-cafe');
  });

  it('handles ports in hostname', () => {
    const res = resolver.resolve(new URL('http://sara-fashion.digitalmenu.daleel-al-suez.com:8787/'));
    assert.equal(res.isTenantSubdomain, true);
    assert.equal(res.tenantSlug, 'sara-fashion');
  });

  it('identifies reserved slugs like www, tools, admin', () => {
    const resTools = resolver.resolve(new URL('https://tools.digitalmenu.daleel-al-suez.com/'));
    assert.equal(resTools.isReserved, true);
    assert.equal(resTools.isTenantSubdomain, false);
    assert.equal(resTools.tenantSlug, 'tools');

    const resAdmin = resolver.resolve(new URL('https://admin.digitalmenu.daleel-al-suez.com/'));
    assert.equal(resAdmin.isReserved, true);
    assert.equal(resAdmin.isTenantSubdomain, false);

    const resApi = resolver.resolve(new URL('https://api.digitalmenu.daleel-al-suez.com/v1'));
    assert.equal(resApi.isReserved, true);
  });

  it('rejects multi-level subdomains as reserved/invalid', () => {
    const res = resolver.resolve(new URL('https://shop.sub.digitalmenu.daleel-al-suez.com/'));
    assert.equal(res.isTenantSubdomain, false);
    assert.equal(res.isReserved, true);
  });

  it('rejects invalid RFC 1123 slugs (consecutive hyphens, special chars)', () => {
    const resDoubleHyphen = resolver.resolve(new URL('https://my--shop.digitalmenu.daleel-al-suez.com/'));
    assert.equal(resDoubleHyphen.isTenantSubdomain, false);

    const resTooShort = resolver.resolve(new URL('https://ab.digitalmenu.daleel-al-suez.com/'));
    assert.equal(resTooShort.isTenantSubdomain, false);
  });

  it('handles unrelated external domains safely', () => {
    const res = resolver.resolve(new URL('https://example.com/'));
    assert.equal(res.isTenantSubdomain, false);
    assert.equal(res.isPlatformRoot, false);
    assert.equal(res.isReserved, false);
  });
});
