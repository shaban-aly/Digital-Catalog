# Requirements Quality Checklist: SEO and Metadata (SEO-001)

- [x] **REQ-001**: Feature ID and metadata (`SEO-001`) clearly identified and registered.
- [x] **REQ-002**: Problem statement and SEO value proposition defined.
- [x] **REQ-003**: Actors and permissions identified (Merchant, Search Crawlers, Public Visitors).
- [x] **REQ-004**: User Story 1 (Canonical Subdomain URL) defined with acceptance criteria.
- [x] **REQ-005**: User Story 2 (Schema.org JSON-LD Structured Data) defined with acceptance criteria.
- [x] **REQ-006**: User Story 3 (OpenGraph & Twitter Cards Preview) defined with acceptance criteria.
- [x] **REQ-007**: User Story 4 (Dynamic XML Sitemap) defined with acceptance criteria.
- [x] **REQ-008**: User Story 5 (Robots Directives) defined with acceptance criteria.
- [x] **REQ-009**: Canonical URL pattern enforced (`https://{slug}.digitalmenu.daleel-al-suez.com/`).
- [x] **REQ-010**: Schema.org distinguishes Restaurant menu from Store collection items.
- [x] **REQ-011**: OpenGraph image fallback chain (cover $\rightarrow$ logo $\rightarrow$ platform default).
- [x] **REQ-012**: Sitemap excludes unpublished and suspended/archived businesses.
- [x] **REQ-013**: Robots.txt disallows private routes (`/dashboard/`, `/auth/`, `/api/`, `/q/`).
- [x] **REQ-014**: Cache headers configured (24 hours for robots.txt and sitemap.xml).
- [x] **REQ-015**: Input/output schemas conform to strict Zod 4 syntax.
- [x] **REQ-016**: Unit test suite planned with 100% pass rate target on Node 24 native test runner.

