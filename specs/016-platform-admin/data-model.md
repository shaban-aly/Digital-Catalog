# Data Model: Platform Super Admin Dashboard (ADM-001)

## 1. Domain Entities & Schemas

### `PlatformKpis`
Platform-wide executive metrics:

```typescript
export interface PlatformKpis {
  totalMerchants: number;
  activeStores: number;
  suspendedStores: number;
  totalProducts: number;
  totalQrScans: number;
}
```

### `BusinessAdminListItem`
Enriched directory representation of a store:

```typescript
export interface BusinessAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'archived';
  planCode: string;
  maxProducts: number;
  maxCategories: number;
  productCount: number;
  createdAt: string;
  subscriptionExpiresAt?: string | null;
  adminNotes?: string | null;
}
```

### `UpdateSubscriptionAdminInput`
```typescript
export interface UpdateSubscriptionAdminInput {
  businessId: string;
  planCode: 'free' | 'pro' | 'enterprise';
  maxProducts: number;
  maxCategories: number;
  subscriptionExpiresAt?: string | null;
  adminNotes?: string;
}
```
