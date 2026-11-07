# Quickstart Guide: Merchant Notifications & In-App Alerts (NOT-001)

## 1. Overview
The Merchant Notification Service provides in-app operational alerting for merchants regarding quota consumption, subscription tier activations, operational status toggles, and platform announcements, operating under a 100% Free-First ($0 budget) model without external paid SMS/Push services.

---

## 2. Usage Examples

### Using NotificationService
```typescript
import { NotificationService } from '@/server/services/notification';

const notificationService = new NotificationService();
const businessId = '123e4567-e89b-12d3-a456-426614174000';

// Dispatch a quota warning notification
await notificationService.createNotification({
  businessId,
  type: 'quota_warning',
  severity: 'warning',
  titleAr: 'اقتراب نفاد حد المنتجات',
  bodyAr: 'لقد استهلكت 80% من حد المنتجات المتاح في باقتك الحالية. قم بالترقية إلى باقة برو لإضافة منتجات غير محدودة.',
  actionUrl: '/dashboard/billing',
});

// Fetch unread count for header badge
const unreadCount = await notificationService.getUnreadCount(businessId);

// List notifications with pagination
const { notifications, total, totalPages } = await notificationService.listNotifications({
  businessId,
  unreadOnly: false,
  page: 1,
  limit: 20,
});

// Mark single notification as read
await notificationService.markAsRead({
  businessId,
  notificationId: 'a0000000-0000-4000-8000-000000000001',
});

// Mark all notifications as read for store
await notificationService.markAllAsRead({
  businessId,
});
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/notifications.test.ts
```
