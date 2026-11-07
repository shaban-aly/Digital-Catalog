# Requirements Quality Checklist: Platform Super Admin Dashboard (ADM-001)

- [x] **REQ-001**: Feature ID and metadata (`ADM-001`) clearly identified and registered.
- [x] **REQ-002**: Problem statement and executive administrative value defined.
- [x] **REQ-003**: Actors and permissions identified (Super Admin, Merchant Owner, Public Visitor).
- [x] **REQ-004**: User Story 1 (Global Platform Overview & KPIs) defined with acceptance criteria.
- [x] **REQ-005**: User Story 2 (Merchant Store Directory & Status Control) defined with acceptance criteria.
- [x] **REQ-006**: User Story 3 (Manual Subscription & Quota Management) defined with acceptance criteria.
- [x] **REQ-007**: User Story 4 (Reserved Subdomain Namespace Governance) defined with acceptance criteria.
- [x] **REQ-008**: Strict Super Admin authorization gate verified (`isSuperAdmin` check; HTTP 403 on denial).
- [x] **REQ-009**: Offline Egyptian payment turnaround (InstaPay / Vodafone Cash manual verification) workflow articulated.
- [x] **REQ-010**: Store status transition (`active`, `suspended`, `maintenance`) propagates immediately to edge routing.
- [x] **REQ-011**: Zero data leakage: merchant emails, internal IDs, and platform KPIs never exposed to unprivileged users.
- [x] **REQ-012**: Audit logging hooks defined for critical admin actions (`admin_notes`, audit records).
- [x] **REQ-013**: Free-first infrastructure preserved: aggregation queries leverage index-only scans in PostgreSQL.
- [x] **REQ-014**: Input/output schemas conform to strict Zod 4 syntax.
- [x] **REQ-015**: Integration with `LifecycleService` and `TenantResolver` documented.
- [x] **REQ-016**: Unit test suite planned with 100% pass rate target on Node 24 native test runner.
