# Architecture & Implementation Plan: Merchant Notifications & Alerts (NOT-001)

## 1. Executive Summary
Feature `NOT-001` delivers a high-performance in-app merchant notification center. Operating under strict Free-First ($0 budget) parameters, it keeps store owners informed of capacity exhaustion, subscription updates, and operational state shifts without recurring SMS fees.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: Notification titles, bodies, severity badges, and action button labels are natively Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: 100% internal PostgreSQL persistence in Supabase free tier ($0 external vendor fees).
- [x] **Gate 3: Zod 4 Compliance**: Validation schemas use strict Zod 4 syntax and RFC 4122-compliant UUID rules.
- [x] **Gate 4: Strict Multi-Tenant Isolation**: Every read, query, and mark-as-read mutation is explicitly locked to `business_id`.
- [x] **Gate 5: Structured Event Taxonomy**: Standardized events (`quota_warning`, `subscription_activated`, `store_status_changed`, `system_announcement`) ensure coherent notifications.
- [x] **Gate 6: Severity Hierarchy**: Supports `info`, `warning`, `critical`, and `success` levels for appropriate visual emphasis.
- [x] **Gate 7: High-Performance Unread Count**: Optimized querying of unread items ensures the dashboard header badge renders with $<10$ms latency.
- [x] **Gate 8: Non-Blocking Delivery**: Notification creation failure never blocks core customer menu rendering, QR scanning, or order handoff.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `MerchantNotification`, `CreateNotificationInput`, and list queries.
- [x] **Gate 10: Automated Test Coverage**: Comprehensive test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - Add notification schemas to `src/shared/schemas.ts`:
     - `NotificationTypeSchema`, `NotificationSeveritySchema`, `CreateNotificationSchema`, `ListNotificationsQuerySchema`, `MarkNotificationReadSchema`, `MarkAllNotificationsReadSchema`.
   - Add notification domain types to `src/shared/types.ts`.
2. **Notification Service (`src/server/services/notification.ts`)**:
   - `createNotification(input: CreateNotificationInput)`
   - `listNotifications(query: ListNotificationsQueryInput)`
   - `getUnreadCount(businessId: string, userId?: string)`
   - `markAsRead(input: MarkNotificationReadInput)`
   - `markAllAsRead(input: MarkAllNotificationsReadInput)`
3. **Automated Unit Testing (`tests/unit/notifications.test.ts`)**:
   - Schema validation tests (UUID constraints, string lengths, event types).
   - In-memory/mock service tests verifying notification creation, unread counting, pagination, and read transitions.
   - Multi-tenant boundary verification ensuring cross-tenant isolation.
4. **Execution & Verification**:
   - Run `node --test tests/unit/notifications.test.ts`.
   - Run all test suites `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.
