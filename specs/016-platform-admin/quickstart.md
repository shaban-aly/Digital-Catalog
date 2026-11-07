# Quickstart Guide: Platform Super Admin Dashboard (ADM-001)

## 1. Overview
The Platform Super Admin Dashboard (`/platform-admin`) enables the platform owner and operations team to oversee all tenant businesses across Suez, monitor high-level growth KPIs, enforce operational status controls (suspension/reactivation), manage reserved subdomain namespaces, and execute manual subscription tier upgrades upon offline payment (InstaPay / Vodafone Cash).

---

## 2. Usage Examples

### Platform Super Admin Service
```typescript
import { PlatformAdminService } from '@/server/services/platform-admin';

const adminService = new PlatformAdminService();

// Verify Super Admin Authorization
const isAuthorized = await adminService.isSuperAdmin('admin-user-uuid');

// Fetch High-Level KPIs
const kpis = await adminService.getPlatformKpis('admin-user-uuid');
// { totalMerchants: 24, activeStores: 22, suspendedStores: 2, totalProducts: 340, totalQrScans: 1450 }

// List & Search Stores
const stores = await adminService.listBusinesses('admin-user-uuid', {
  search: 'baraka',
  status: 'active',
  page: 1,
  limit: 20,
});

// Update Store Operational Status (e.g. suspend)
await adminService.updateBusinessStatus('admin-user-uuid', {
  businessId: '123e4567-e89b-12d3-a456-426614174000',
  status: 'suspended',
  reason: 'عدم سداد الاشتراك الشهري',
});

// Manual Subscription Upgrade after InstaPay / Vodafone Cash Transfer
await adminService.updateBusinessSubscription('admin-user-uuid', {
  businessId: '123e4567-e89b-12d3-a456-426614174000',
  planCode: 'pro',
  maxProducts: 500,
  maxCategories: 30,
  subscriptionExpiresAt: '2027-11-06T00:00:00.000Z',
  adminNotes: 'تم السداد عبر إنستاباي - مرجع تحويل #984210',
});
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/platform-admin.test.ts
```
