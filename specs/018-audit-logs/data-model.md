# Data Model: Audit Logs & Governance History (AUD-001)

## 1. Domain Entities & Schemas

### `AuditAction`
```typescript
export type AuditAction =
  | 'tenant_role_changed'
  | 'tenant_member_removed'
  | 'store_status_changed'
  | 'subscription_tier_updated'
  | 'catalog_lifecycle_changed'
  | 'business_profile_updated';
```

### `AuditTargetType`
```typescript
export type AuditTargetType = 'member' | 'business' | 'catalog' | 'subscription' | 'product';
```

### `AuditLogRecord`
```typescript
export interface AuditLogRecord {
  id: string;
  businessId: string;
  actorId?: string | null;
  actorRole: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}
```

### `RecordAuditInput`
```typescript
export interface RecordAuditInput {
  businessId: string;
  actorId?: string;
  actorRole: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}
```

### `ListAuditLogsQuery`
```typescript
export interface ListAuditLogsQuery {
  businessId: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  page?: number;
  limit?: number;
}
```
