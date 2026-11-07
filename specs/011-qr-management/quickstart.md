# Quickstart Guide: QR Code Management (QR-001)

## 1. Overview
QR Code Management delivers permanent, physical printable QR links for merchants in Suez. Short codes use collision-safe Base32 characters (`/q/{shortCode}`) and redirect via Cloudflare Worker edge 302 directly to the store menu in <50ms.

---

## 2. Usage Examples

### Generating or Fetching Business QR Code
```typescript
import { qrService } from '@/server/services/qr';

const qr = await qrService.getOrCreateQRCode({
  businessId: '123e4567-e89b-12d3-a456-426614174000',
});

console.log('Short URL:', qr.redirect_url); // https://digitalmenu.daleel-al-suez.com/q/7x9m2p
```

### Resolving QR Destination (Edge Route)
```typescript
import { qrService } from '@/server/services/qr';

const destination = await qrService.resolveDestination('7x9m2p');
if (destination) {
  // Returns HTTP 302 -> destination.destinationUrl
}
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/qr-management.test.ts
```

