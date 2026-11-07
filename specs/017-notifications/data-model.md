# Data Model: Merchant Notifications & In-App Alerts (NOT-001)

## 1. Domain Entities & Schemas

### `NotificationType`
```typescript
export type NotificationType =
  | 'quota_warning'
  | 'subscription_activated'
  | 'store_status_changed'
  | 'system_announcement';
```

### `NotificationSeverity`
```typescript
export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';
```

### `MerchantNotification`
```typescript
export interface MerchantNotification {
  id: string;
  businessId: string;
  recipientUserId?: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  titleAr: string;
  bodyAr: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}
```

### `CreateNotificationInput`
```typescript
export interface CreateNotificationInput {
  businessId: string;
  recipientUserId?: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  titleAr: string;
  bodyAr: string;
  actionUrl?: string;
}
```

### `ListNotificationsQuery`
```typescript
export interface ListNotificationsQuery {
  businessId: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
```
