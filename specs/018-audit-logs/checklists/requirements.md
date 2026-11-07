# Requirements Checklist: Audit Logs & Governance History (AUD-001)

- [x] **REQ-001**: Audit log records are strictly partitioned and queried by `business_id`.
- [x] **REQ-002**: Only tenant `owner` or `admin` roles possess permission to read audit trails.
- [x] **REQ-003**: Tenant `editor` and `viewer` roles are barred with HTTP 403 Forbidden.
- [x] **REQ-004**: Supports action type `tenant_role_changed` with actor, target user, and new role.
- [x] **REQ-005**: Supports action type `tenant_member_removed` with actor and removed user.
- [x] **REQ-006**: Supports action type `store_status_changed` (active, suspended, archived).
- [x] **REQ-007**: Supports action type `subscription_tier_updated` (plan code, max products, quotas).
- [x] **REQ-008**: Supports action type `catalog_lifecycle_changed` (published, unpublished).
- [x] **REQ-009**: Supports action type `business_profile_updated` (store name, slug, phone changes).
- [x] **REQ-010**: All audit entries are append-only; update and delete mutations are strictly prevented.
- [x] **REQ-011**: Audit event recording failures do not block or roll back the primary user mutation.
- [x] **REQ-012**: All action titles, summary lines, and filter labels are natively in Arabic RTL.
- [x] **REQ-013**: Zod 4 schemas validate all audit payloads, query filters, and RFC 4122 UUID parameters.
- [x] **REQ-014**: Audit queries support page-based pagination (default 20, max 100) and action filtering.
- [x] **REQ-015**: Stored directly in PostgreSQL ($0 external infrastructure cost compliant).
- [x] **REQ-016**: Unit test suite validates access control guards, schema parsing, filtering, and append operations.
