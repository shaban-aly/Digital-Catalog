# Quickstart Guide: External Custom Domains (DOM-002)

## 1. Overview
The External Custom Domains engine enables Pro merchants to link their proprietary domains (e.g. `menu.albaraka.com`) to their digital menu storefront with DNS challenge verification and RFC 1123 compliance.

---

## 2. Usage Examples

### Registering and Verifying a Custom Domain
```typescript
import { CustomDomainService } from '@/server/services/custom-domain';

const domainService = new CustomDomainService();
const businessId = '123e4567-e89b-12d3-a456-426614174000';

// 1. Register domain (Pro Tier only)
const record = await domainService.registerCustomDomain({
  businessId,
  hostname: 'menu.albaraka.com',
  planCode: 'pro',
});

console.log(record);
// {
//   id: 'uuid',
//   hostname: 'menu.albaraka.com',
//   status: 'pending_verification',
//   txtChallengeHost: '_digitalmenu-challenge.menu.albaraka.com',
//   verificationToken: 'dm_verify_a1b2c3...',
//   cnameTarget: 'custom.digitalmenu.daleel-al-suez.com'
// }

// 2. Verify domain after merchant configures DNS TXT record
const verified = await domainService.verifyCustomDomain({
  businessId,
  domainId: record.id,
  simulatedToken: record.verificationToken,
});

// 3. Resolve incoming hostname at the edge
const resolution = await domainService.resolveCustomDomain('menu.albaraka.com');
// { status: 'active', businessId: '...', businessSlug: 'al-baraka', hostname: 'menu.albaraka.com' }
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/external-custom-domains.test.ts
```
