# Feature Specification: Merchant Notifications & In-App Alerts (NOT-001)

**Feature Branch**: `017-notifications`

**Feature ID**: `NOT-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Release**: MVP Core / Extension

**Input**: User directive: "إشعار التاجر بالأحداث المهمة (تجاوز أو اقتراب نفاد الحصص والحدود، تغييرات حالة المتجر والاشتراك، تنبيهات الترقية) عبر لوحة التحكم بنظام إشعارات داخلي Free-First بدون تكاليف إضافية للبوابات المدفوعة."

---

## Purpose and Business Value

Provide merchants with a centralized, real-time in-app notification center within their merchant workspace (`/dashboard`) that alerts them to critical operational events (approaching 80% / 100% quota limits, manual subscription activations by Super Admin, account suspension/reactivation notices, and platform announcements) while strictly respecting the **Free-First ($0 budget)** architecture by operating directly on Supabase PostgreSQL without relying on costly third-party SMS or push notification vendors.

---

## Scope and Boundaries

- **In Scope**:
  - In-app notification inbox and unread counter badge in merchant dashboard.
  - Event types:
    - `quota_warning`: Alert when product/category count hits $\ge 80\%$ or $100\%$ limit.
    - `subscription_activated`: Alert when Super Admin manually activates or upgrades Pro tier.
    - `store_status_changed`: Notice when store operational status is changed (active/suspended).
    - `system_announcement`: Platform-wide messages and operational updates.
  - Notification management: list notifications, filter unread, mark individual notification as read, mark all notifications as read, and count unread alerts.
  - Arabic RTL localized alerts with contextual deep links (`action_url`).
  - Strict tenant isolation: merchants can only access notifications belonging to their specific `business_id`.
- **Out of Scope (Deferred to Future Releases)**:
  - Paid SMS gateways (Twilio / Vodafone SMS API).
  - Web Push notifications with service worker push subscriptions.
  - Promotional marketing broadcasts to public customers.

---

## Actors and Permissions

- **Merchant (Owner / Admin / Editor)**: Can view and acknowledge notifications for their own tenant store.
- **Platform System / Super Admin**: Dispatches authorized alerts (e.g., status changes, plan upgrades).
- **Public Customer**: Zero access to merchant notifications.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Viewing Merchant Notification Inbox & Unread Badge (Priority: P1)

As a merchant owner, I want to see an unread notification counter badge in my dashboard header and open a notification drawer/panel to review recent alerts so I never miss important operational updates.

**Why this priority**: Immediate operational visibility. Ensures merchants are informed of quota alerts and subscription status changes.

**Independent Test**: Can be tested by generating notifications for a merchant, querying the unread count, and listing notification items sorted chronologically.

**Acceptance Scenarios**:

1. **Given** a merchant with 3 unread alerts, **When** they load the dashboard, **Then** the notification bell badge displays `3` and the drawer lists all 3 alerts with Arabic titles and timestamps.
2. **Given** a merchant with 0 unread alerts, **When** they view the notification bell, **Then** no unread badge is displayed, and opening the inbox shows an Arabic empty state ("لا توجد إشعارات جديدة").

---

### User Story 2 - Quota & Limit Exhaustion Alerts (Priority: P1)

As a merchant, when my store reaches 80% or 100% of my product or category limit, I want to receive an automatic warning alert with an upgrade link so I can arrange a Pro tier upgrade before my storefront is constrained.

**Why this priority**: Directly drives platform monetization and prevents unexpected product addition failures.

**Independent Test**: Can be tested by triggering a quota check that exceeds the 80% threshold, verifying that a `quota_warning` notification is generated with an action link pointing to `/dashboard/billing`.

**Acceptance Scenarios**:

1. **Given** a merchant on the Free tier (limit 100 products) who adds their 80th product, **When** the quota reaches 80%, **Then** an Arabic warning notification ("اقتراب نفاد حد المنتجات: استهلكت 80% من باقتك المجانية") is queued with an action link to upgrade.
2. **Given** a merchant who reaches 100% quota, **When** they attempt to exceed it, **Then** an urgent notification is dispatched advising them to contact admin on WhatsApp to upgrade.

---

### User Story 3 - Acknowledging & Marking Notifications as Read (Priority: P2)

As a merchant, I want to mark specific notifications as read or mark all notifications as read in one click so that my unread counter resets.

**Why this priority**: Essential UI hygiene and usability.

**Independent Test**: Can be tested by calling `markAsRead` on a specific notification ID or `markAllAsRead` for the tenant and verifying `read_at` timestamp is populated and unread count decrements to 0.

**Acceptance Scenarios**:

1. **Given** an unread notification, **When** the merchant clicks "تحديد كمقروء", **Then** its status changes to read, `read_at` is set, and the unread count decreases by 1.
2. **Given** multiple unread notifications, **When** the merchant clicks "تعيين الكل كمقروء", **Then** all pending notifications for that store are marked read simultaneously.

---

## Technical Constraints & Design Principles

1. **$0 Infrastructure Cost**: Operates entirely in PostgreSQL (`notifications` table) with lightweight queries, no external paid messaging subscriptions.
2. **Arabic RTL First**: All system alert templates, severity labels, and buttons are natively Arabic.
3. **Multi-Tenant Security**: Every query strictly enforces `WHERE business_id = :businessId`. Cross-tenant querying is impossible.
4. **Zod 4 Compliance**: Robust schema validation for creating, querying, and updating notifications.
