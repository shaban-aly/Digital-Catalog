# Requirements Quality Checklist: Store and Catalog Lifecycle (LIF-001)

- [x] **REQ-001**: Feature ID and metadata (`LIF-001`) clearly identified and registered.
- [x] **REQ-002**: Problem statement and business value explicitly defined.
- [x] **REQ-003**: Actors and permissions identified (Merchant Owner/Admin, Super Admin, Public Visitor).
- [x] **REQ-004**: User Story 1 (Catalog Publication Toggle) written in standard format with acceptance criteria.
- [x] **REQ-005**: User Story 2 (Business Operational Status Management) written in standard format with acceptance criteria.
- [x] **REQ-006**: User Story 3 (Edge Availability Resolution & Arabic Error Page Rendering) written in standard format.
- [x] **REQ-007**: Business operational statuses strictly enum-typed (`active`, `suspended`, `archived`).
- [x] **REQ-008**: Catalog publication status modeled as boolean `is_published` with explicit defaults.
- [x] **REQ-009**: Hierarchy of lifecycle checks established: Business status precedes Catalog publication status.
- [x] **REQ-010**: All edge error pages rendered in authentic Arabic RTL with appropriate HTTP status codes (403, 404).
- [x] **REQ-011**: Zero raw leaks guaranteed: no SQL errors, internal UUIDs, or stack traces rendered to public visitors.
- [x] **REQ-012**: Cache control policies clearly defined (no-cache for offline/suspended states; bounded max-age for static edge errors).
- [x] **REQ-013**: Tenant isolation and multi-tenant security rules verified (RLS enforcement on updates).
- [x] **REQ-014**: Input validation schemas use strict Zod 4 syntax (`z.string('...')`).
- [x] **REQ-015**: Integration with `TenantResolver`, `PublicCatalogService`, and `entry-worker.ts` documented.
- [x] **REQ-016**: Test strategy defined using Node 24 native test runner (`node --test`) with 100% pass target.

