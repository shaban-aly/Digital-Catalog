# Technical Research: Business & Store Management (BIZ-001)

**Feature**: `BIZ-001: Business and Store Management`  
**Date**: 2026-11-06  
**Status**: Completed

---

## 1. Subdomain Slug Validation & DNS RFC 1123 Compliance

### Context & Challenge
Every store operates under a dedicated subdomain (`{store-slug}.digitalmenu.daleel-al-suez.com`). For Cloudflare Workers and global DNS servers to route traffic without errors, every slug must strictly conform to DNS label standards (RFC 1123):
- Length between 3 and 63 characters.
- Lowercase alphanumeric characters (`a-z`, `0-9`) and hyphens (`-`).
- Must not begin or end with a hyphen.
- Must not contain consecutive hyphens (`--`), which are reserved for IDN Punycode prefixes (`xn--`).
- Must not collide with reserved platform subdomains (`admin`, `api`, `support`, `billing`, `digitalmenu`, `suez`, etc.).

### Validation Regex & Normalization Algorithm
```typescript
export const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

export function validateSlugFormat(rawSlug: string): { valid: boolean; error?: string } {
  const clean = rawSlug.trim().toLowerCase();
  if (clean.length < 3) {
    return { valid: false, error: 'الرابط قصير جداً (3 أحرف على الأقل)' };
  }
  if (clean.length > 63) {
    return { valid: false, error: 'الرابط طويل جداً (63 حرف كحد أقصى)' };
  }
  if (clean.includes('--')) {
    return { valid: false, error: 'لا يمكن استخدام شرطتين متتاليتين في الرابط' };
  }
  if (!SLUG_REGEX.test(clean)) {
    return { valid: false, error: 'الرابط يجب أن يبدأ وينتهي بحرف أو رقم إنجليزي ويحتوي على شرطة واحدة فقط' };
  }
  return { valid: true };
}
```

---

## 2. Atomic Multi-Table Store Provisioning

### Challenge
Creating a store requires multiple records across several tables:
1. `businesses` (Core business record)
2. `business_members` (Assigning `owner` role)
3. `branches` (1 default branch "الفرع الرئيسي")
4. `catalogs` (Primary published catalog)

If step 3 or 4 fails due to network dropouts or database constraint issues, an orphan business record without a default branch or catalog would corrupt merchant onboarding.

### Solution: Dual Strategy (PostgreSQL Transactional RPC + Client-Side Compensating Rollback)
1. **Primary Strategy (PostgreSQL Stored Procedure / RPC)**:
   A single transactional function `create_merchant_business` runs within a single PostgreSQL transaction (`BEGIN ... COMMIT`). If any insert fails, PostgreSQL automatically rolls back the entire transaction.
2. **Fallback Strategy**:
   If the RPC is not yet executed against the database, the TypeScript client executes the sequence and performs a compensating rollback (`DELETE FROM businesses WHERE id = ...`) if membership assignment fails.

---

## 3. Real-Time Slug Availability Debouncing

### Architecture
- Client inputs are debounced by 300ms using a standard timer.
- Client runs the RFC 1123 regex locally first (0ms latency, 0 database queries for malformed inputs).
- If format passes, it checks the database via PostgREST `ilike('slug', cleanSlug)`.
- Returns clear Arabic visual state (`idle`, `checking`, `available`, `unavailable`).

