# Quickstart Guide: Merchant Dashboard Workspace (MCH-001)

## 1. Overview
The Merchant Dashboard is the primary operations control room for Suez store owners. It consolidates product and category catalogs, live menu preview links, permanent subdomain copy banners, QR download launchers, and privacy-safe customer engagement analytics.

---

## 2. Usage Examples

### Dashboard Shell Authentication Guard
```typescript
import { sanitizeRedirectUrl } from '@/client/utils/redirect';

// If unauthenticated:
const safeRedirect = sanitizeRedirectUrl('/dashboard', '/dashboard');
navigate({ to: '/auth/login', search: { redirect: safeRedirect } });
```

### Formatting Subdomain URL
```typescript
const subdomainUrl = `https://${business.slug}.digitalmenu.daleel-al-suez.com/`;
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/merchant-dashboard.test.ts
```

