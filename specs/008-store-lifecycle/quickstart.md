# Quickstart Guide: Store and Catalog Lifecycle (LIF-001)

## 1. Overview
The Store and Catalog Lifecycle module guarantees that merchants can publish or unpublish their menus at will, while system administrators can control store operation states (`active`, `suspended`, `archived`). Public visitors are served fast, edge-rendered Arabic status pages when a store is not actively available.

---

## 2. Usage Examples

### Toggling Catalog Publication (Merchant Dashboard)
```typescript
import { lifecycleService } from '@/server/services/lifecycle';

// Unpublish catalog for menu revisions
const updatedCatalog = await lifecycleService.setCatalogPublication(
  businessId,
  catalogId,
  false // unpublish
);
console.log('Catalog published state:', updatedCatalog.is_published);
```

### Suspending a Delinquent Business (Super Admin)
```typescript
import { lifecycleService } from '@/server/services/lifecycle';

const suspended = await lifecycleService.setBusinessStatus(
  businessId,
  'suspended',
  'Pending identity verification'
);
console.log('New Business Status:', suspended.status);
```

### Edge Availability Check (Subdomain / Public Entry)
```typescript
import { lifecycleService } from '@/server/services/lifecycle';
import { tenantErrorPages } from '@/server/tenant/error-pages';

const resolution = await lifecycleService.resolveStoreAvailability('al-baraka-market');

switch (resolution.status) {
  case 'active':
    // Proceed to render public catalog
    break;
  case 'unpublished':
    return tenantErrorPages.unpublished('al-baraka-market');
  case 'suspended':
  case 'archived':
    return tenantErrorPages.suspended('al-baraka-market');
  case 'not_found':
    return tenantErrorPages.notFound('al-baraka-market');
  case 'reserved':
    return tenantErrorPages.reserved();
}
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/store-lifecycle.test.ts
```

