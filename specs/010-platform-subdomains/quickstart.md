# Quickstart & Verification Guide: Platform Subdomains (DOM-001)

**Feature**: `DOM-001: Platform Subdomains and Hostname Resolution`  
**Date**: 2026-11-07  
**Status**: Ready for Verification

This guide outlines runnable scenarios to verify hostname resolution, platform root identification, reserved subdomains blocking, and tenant storefront edge routing for `{slug}.digitalmenu.daleel-al-suez.com`.

---

## Verification Scenarios

### Scenario 1: Platform Root Domain Identification
1. Resolve `https://digitalmenu.daleel-al-suez.com/`.
2. **Expected**:
   - `isPlatformRoot`: `true`
   - `isTenantSubdomain`: `false`
   - `tenantSlug`: `null`

### Scenario 2: Tenant Subdomain Resolution
1. Resolve `https://ahmed-cafe.digitalmenu.daleel-al-suez.com/`.
2. **Expected**:
   - `isTenantSubdomain`: `true`
   - `tenantSlug`: `"ahmed-cafe"`
   - `isPlatformRoot`: `false`
   - `isReserved`: `false`

### Scenario 3: Reserved Subdomain Interception
1. Resolve `https://admin.digitalmenu.daleel-al-suez.com/` or `https://tools.digitalmenu.daleel-al-suez.com/`.
2. **Expected**:
   - `isReserved`: `true`
   - `isTenantSubdomain`: `false`
   - Edge worker returns HTTP 404 with Arabic "نطاق نظام محجوز".

### Scenario 4: Case Insensitivity & Port Normalization
1. Resolve `http://Ahmed-Cafe.DigitalMenu.Daleel-Al-Suez.com:8787/`.
2. **Expected**:
   - `isTenantSubdomain`: `true`
   - `tenantSlug`: `"ahmed-cafe"` (normalized lowercase).

### Scenario 5: RFC 1123 Validation & Multi-Level Rejection
1. Resolve `https://my--shop.digitalmenu.daleel-al-suez.com/` (double hyphen) or `https://a.b.digitalmenu.daleel-al-suez.com/` (multi-level).
2. **Expected**:
   - `isTenantSubdomain`: `false`
   - `isReserved`: `true` (for multi-level) or unparsed.

---

## Automated Verification Commands

```powershell
# 1. Run Platform Subdomains Unit Test Suite
node --test tests/unit/platform-subdomains.test.ts

# 2. Strict TypeScript Typecheck
npx tsc --noEmit
```
