# Technical Research: Merchant Notifications & In-App Alerts (NOT-001)

## 1. Notification Architecture Under Free-First ($0 Budget) Constraints

In standard multi-tenant SaaS platforms, notifications often involve external SMS aggregators (e.g., Twilio, Infobip) or push service providers (OneSignal, Firebase Cloud Messaging). For an Egyptian local retail platform in Suez operating under a strict **$0/month infrastructure cost principle**:
- **Paid SMS**: Cost per Egyptian SMS (~0.30 - 0.50 EGP per message) creates recurring variable debt without guaranteed merchant revenue.
- **In-App Notification Center**: A persistent PostgreSQL table `notifications` coupled with optimistic client-side polling or revalidation provides 100% reliable, zero-cost delivery.
- **WhatsApp Order Handoff**: For customer-to-merchant communications, Feature `COM-001` already leverages client-side `wa.me` URLs, which cost $0 and require no backend webhook infrastructure.

## 2. Notification Data Model & Indexing Strategy

To keep query latency under 15ms:
- Table: `notifications`
  - `id` (UUID PK)
  - `business_id` (UUID FK $\rightarrow$ `businesses.id`)
  - `recipient_user_id` (UUID nullable, targeting specific merchant member or all store members)
  - `type` (`quota_warning`, `subscription_activated`, `store_status_changed`, `system_announcement`)
  - `severity` (`info`, `warning`, `critical`, `success`)
  - `title_ar` (Text)
  - `body_ar` (Text)
  - `action_url` (Text nullable, e.g., `/dashboard/billing` or `/dashboard/products`)
  - `read_at` (TIMESTAMPTZ nullable)
  - `created_at` (TIMESTAMPTZ)
- Index: `idx_notifications_unread` on `(business_id, read_at) WHERE read_at IS NULL` for instant unread count computation.
- Index: `idx_notifications_tenant_created` on `(business_id, created_at DESC)` for high-performance chronological inbox display.
