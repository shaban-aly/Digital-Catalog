# Quickstart Guide: Privacy-Safe Analytics (ANL-001)

## 1. Overview
Privacy-Safe Analytics provides merchants with engagement metrics (scans, views, conversions) while guaranteeing customer privacy through subnet truncation, daily rotating salts, and bot traffic separation.

---

## 2. Usage Examples

### Generating a Daily Salted Fingerprint (Edge)
```typescript
import { generatePrivacyFingerprint } from '@/server/services/analytics';

const hash = await generatePrivacyFingerprint(
  '197.38.12.89',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)...'
);

// Returns 64-char hex SHA-256 hash. Zero raw IP is stored.
```

### Checking for Crawler / Bot Traffic
```typescript
import { isCrawlerOrBot } from '@/server/services/analytics';

const isBot = isCrawlerOrBot('WhatsApp/2.21.10.15 i');
console.log(isBot); // true -> Bot preview scan, do not increment human counter
```

### Fetching Business Analytics Summary
```typescript
import { analyticsService } from '@/server/services/analytics-summary';

const metrics = await analyticsService.getBusinessMetrics('123e4567-e89b-12d3-a456-426614174000');
console.log(metrics);
// { totalScans: 150, totalViews: 210, totalWhatsAppClicks: 33, uniqueVisitorsEstimate: 120 }
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/analytics-privacy.test.ts
```

