# Requirements Checklist: Merchant Notifications & Alerts (NOT-001)

- [x] **REQ-001**: Notification inbox supports querying paginated notification records scoped strictly to `business_id`.
- [x] **REQ-002**: Unread counter badge computes total unread notifications for a merchant store in real time.
- [x] **REQ-003**: Supports event type `quota_warning` for when products/categories reach 80% or 100% capacity.
- [x] **REQ-004**: Supports event type `subscription_activated` when Super Admin upgrades plan via offline payment.
- [x] **REQ-005**: Supports event type `store_status_changed` when store operational status changes (active/suspended).
- [x] **REQ-006**: Supports event type `system_announcement` for platform-wide alerts and messages.
- [x] **REQ-007**: Every notification record stores `title_ar`, `body_ar`, optional `action_url`, `type`, `read_at`, and `created_at`.
- [x] **REQ-008**: Single-click `markAsRead` API updates `read_at` timestamp for a specific notification.
- [x] **REQ-009**: Bulk `markAllAsRead` API marks all pending unread notifications for the tenant as read.
- [x] **REQ-010**: All user-facing titles, messages, and action buttons are natively in Arabic RTL.
- [x] **REQ-011**: Zero third-party paid messaging dependencies ($0 infrastructure cost compliant).
- [x] **REQ-012**: Strict multi-tenant isolation prevents cross-tenant access to notifications.
- [x] **REQ-013**: Zod 4 schemas validate all notification payloads and query inputs with RFC 4122 UUID format.
- [x] **REQ-014**: Notification queries default to 20 items per page with a maximum ceiling of 100 items.
- [x] **REQ-015**: Delivery failures or errors do not interrupt core customer browsing or merchant catalog operations.
- [x] **REQ-016**: Unit test suite covers all lifecycle states, schema validation, unread count logic, and mark-as-read mutations.
