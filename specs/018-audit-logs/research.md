# Technical Research: Audit Logs & Governance History (AUD-001)

## 1. Compliance & Security in Multi-Tenant SaaS

In multi-tenant SaaS architectures:
- Audit logs differ fundamentally from application telemetry/analytics (`ANL-001`): analytics tracks customer traffic patterns anonymously, whereas audit logs record privileged human actions (who did what, to which resource, and when).
- **Access Guard**: Only users with elevated store privileges (`owner` or `admin`) must be allowed to inspect audit entries. Exposing audit records to casual editors or viewers violates the principle of least privilege.
- **Append-Only Immutability**: Audit records must never be modified or deleted by merchants. In PostgreSQL, this can be enforced via RLS policies allowing `SELECT` and `INSERT` only, with `UPDATE` and `DELETE` explicitly prohibited.

## 2. Low-Overhead Storage & Indexing Under Free-First Constraints

To maintain zero infrastructure cost:
- Table: `audit_logs`
  - `id` (UUID PK)
  - `business_id` (UUID FK $\rightarrow$ `businesses.id`)
  - `actor_id` (UUID nullable for system actions)
  - `actor_role` (VARCHAR)
  - `action` (VARCHAR, e.g. `tenant_role_changed`, `store_status_changed`, etc.)
  - `target_type` (`member`, `business`, `catalog`, `subscription`, `product`)
  - `target_id` (VARCHAR)
  - `details` (JSONB)
  - `ip_address` (VARCHAR nullable)
  - `created_at` (TIMESTAMPTZ)
- Index: `idx_audit_logs_tenant_time` on `(business_id, created_at DESC)` ensures instant paginated retrieval without full table scans.
