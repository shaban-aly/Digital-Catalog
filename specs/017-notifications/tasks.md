# Tasks: Merchant Notifications & In-App Alerts (NOT-001)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align notification schemas in `specs/017-notifications/contracts/notification-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align notification domain types in `src/shared/types.ts`.

## Phase 2: Core Notification Service Implementation
- [x] **TASK-003**: Implement `NotificationService` in `src/server/services/notification.ts`:
  - `createNotification(input: CreateNotificationInput): Promise<MerchantNotification>`
  - `listNotifications(query: ListNotificationsQueryInput): Promise<{ notifications: MerchantNotification[], total: number, page: number, totalPages: number }>`
  - `getUnreadCount(businessId: string, userId?: string): Promise<number>`
  - `markAsRead(input: MarkNotificationReadInput): Promise<{ id: string, readAt: string }>`
  - `markAllAsRead(input: MarkAllNotificationsReadInput): Promise<{ count: number }>`

## Phase 3: Automated Testing & Verification
- [x] **TASK-004**: Create comprehensive test suite `tests/unit/notifications.test.ts` covering:
  - Zod 4 schema validation (event types, severity, title/body lengths, RFC 4122 UUIDs).
  - Unread count calculation and zero-state handling.
  - Pagination and unread-only filtering.
  - Read timestamp mutations (`markAsRead` and `markAllAsRead`).
  - Strict multi-tenant isolation.
- [x] **TASK-005**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-006**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-007**: Update `docs/specifications/feature-registry.md` marking `NOT-001` as `Implemented & Verified`.
