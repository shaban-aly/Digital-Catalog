# Requirements Checklist: Bulk Catalog & Menu Import (IMP-001)

- [x] **REQ-001**: Supports importing products and categories from structured CSV text or JSON array.
- [x] **REQ-002**: CSV parser operates natively without unapproved third-party npm dependencies ($0 cost).
- [x] **REQ-003**: Enforces presence of mandatory Arabic fields: `category_name_ar` and `name_ar`.
- [x] **REQ-004**: Validates non-negative numeric `price` (in EGP currency).
- [x] **REQ-005**: Resolves and maps existing categories by Arabic name to prevent duplicate categories.
- [x] **REQ-006**: Creates missing categories automatically with default sort order.
- [x] **REQ-007**: Performs upfront quota validation against store's `max_products` plan limit (`LMT-001`).
- [x] **REQ-008**: Rejects import upfront if total products would exceed tier limits.
- [x] **REQ-009**: Reports detailed row-by-row validation feedback identifying exact line numbers and Arabic errors.
- [x] **REQ-010**: All error messages, field labels, and summary notifications are natively Arabic RTL.
- [x] **REQ-011**: Strictly scopes all operations to the merchant's `business_id` (cross-tenant write impossible).
- [x] **REQ-012**: Enforces tenant authorization: `editor`, `admin`, or `owner` role required; `viewer` rejected with 403.
- [x] **REQ-013**: Zod 4 schemas validate import rows, preview inputs, and batch execution parameters.
- [x] **REQ-014**: Bounded batch import limit (maximum 500 rows per request) prevents worker timeout.
- [x] **REQ-015**: Optional fields (`name_en`, `description_ar`, `image_url`, `is_available`) handled cleanly.
- [x] **REQ-016**: Unit test suite validates CSV parsing, row validation, quota blocking, category deduplication, and role guards.
