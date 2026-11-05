<!--
Sync Impact Report
Version change: uninitialized → 1.0.0
Modified principles: N/A (Initial Ratification)
Added sections: Core Principles (I through VII), Technical Stack & Infrastructure Constraints, Development Workflow & Quality Gates, Governance
Removed sections: None
Follow-up TODOs: None
-->

# Digital Catalog & QR Platform Constitution

## Core Principles

### I. Spec-Driven & Plan-First (NON-NEGOTIABLE)
No feature implementation, database migration, or application code may be written without an approved specification (`spec.md`), technical architecture plan (`plan.md`), and dependency-ordered tasks (`tasks.md`). Every change must trace directly to an accepted user story and acceptance criteria. Ad-hoc development and scope creep outside the approved task boundaries are strictly prohibited.

### II. Free-First & Zero-Cost Guardrails
The platform is designed to operate reliably at $0 monthly infrastructure cost during the launch phase. Every architectural and code decision MUST respect Cloudflare Workers Free quotas (100k requests/day, 10ms CPU time) and Supabase Free limits (500MB DB, 1GB Storage, 2GB Egress). Client-side WebP compression (<100KB, max 1080px), Cloudflare CDN edge caching for public catalogs and images, and atomic PostgreSQL quota locks are non-negotiable architectural mandates.

### III. Single Source of Truth for Security & Multi-Tenancy
PostgreSQL Row Level Security (RLS) is the supreme, unbypassable security boundary. Client-side route guards and UI state checks are strictly for UX flow and are never considered security mechanisms. Authentication is managed via Supabase Auth (JWT). Multi-tenant isolation is strictly enforced at the database layer using `tenant_id` / `business_id`. The Supabase Service Role Key is strictly barred from client-side bundles and public runtime code; its use is restricted exclusively to isolated background administrative scripts and system webhooks.

### IV. Mobile-First & Edge-Rendered Public Experience
The public catalog is the core consumer-facing product and must achieve sub-second perceived load times on mobile networks. Public catalog routes (`/c/:catalogSlug`) MUST be Server-Side Rendered (SSR) on Cloudflare Workers and cached at Cloudflare CDN edge nodes. Every public catalog must include complete dynamic OpenGraph preview cards for WhatsApp/social sharing, canonical links to `https://catalog.daleel-al-suez.com/`, and valid Schema.org JSON-LD structured data.

### V. Decoupled Catalog Domain & Hierarchical Pricing
The domain model strictly decouples master inventory from presentation placement:
- `products` represents the canonical inventory item owned by the business.
- `catalog_items` represents the curated placement of a product within a specific catalog, allowing catalog-level price overrides, sort ordering, and category assignment.
- Categories belong to the business as a master taxonomy and are customized per catalog via join entities.
- Pricing follows a strict hierarchy: Product base price -> Variant price -> Option value delta -> Catalog item override.

### VI. Non-Blocking Dynamics & Privacy-Safe Analytics
QR code redirects (`/q/:shortCode`) MUST execute an immediate HTTP 302 redirect (target <40ms) without waiting for analytics logging. Analytics event ingestion MUST be asynchronous and non-blocking. To safeguard privacy and comply with regulations, raw IP addresses MUST NEVER be stored. Unique visitors must be estimated using daily rotating salted HMAC hashes or HyperLogLog structures that discard correlation across days. Crawlers and preview bots (e.g., WhatsApp preview bot) must be categorized separately and excluded from commercial human scan counts.

### VII. Impeccable Design & Arabic-First (RTL) Accessibility
The platform's user interface must embody the highest standards of product design (Impeccable Design). Arabic RTL is the primary, first-class locale, with seamless English LTR symmetry. Design tokens (colors, typography, spacing, elevations) must be centrally defined and systematically applied using Tailwind CSS and accessible component primitives (shadcn/ui). Both the Merchant Dashboard and the Public Catalog must maintain clear visual hierarchy, thoughtful micro-interactions, responsive mobile ergonomics, and meaningful loading/empty states.

## Technical Stack & Infrastructure Constraints

- **Full-Stack Framework**: React 19, TypeScript (strict mode), TanStack Start.
- **Routing & State**: TanStack Router (type-safe file-based routing), TanStack Query (server state), TanStack Form (form state), TanStack Table (data grids).
- **Deployment & Edge Engine**: Cloudflare Workers via `@cloudflare/vite-plugin`, `@tanstack/react-start/plugin/vite`, and `wrangler.jsonc`.
- **Primary Domain & URL Architecture**:
  - Base: `https://catalog.daleel-al-suez.com/` (Default Currency: EGP / ج.م)
  - Edge SSL: Cloudflare Universal SSL/TLS (HTTPS enforced).
  - DNS Isolation: Zero interference with apex domain `daleel-al-suez.com` records (MX, root A, TXT).
  - Fallback: `*.workers.dev` retained strictly for internal staging previews.
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Supabase Storage.
  - Communication from Workers: HTTPS / PostgREST (stateless, zero connection pool exhaustion).
  - Storage Interface: `IStorageProvider` abstraction for future migration to Cloudflare R2 without business logic changes.
- **Backup & Disaster Recovery**:
  - Automated daily `pg_dump` executed via GitHub Actions.
  - Mandatory client-side encryption (AES-256 via `age`/`gpg`) before leaving the runner.
  - Encrypted archives uploaded directly to a private Cloudflare R2 bucket (10GB free tier). No merchant data in GitHub Releases.

## Development Workflow & Quality Gates

1. **Phase 1 – Specification**: Features are defined with clear actors, user stories, business rules, edge cases, and verifiable acceptance criteria.
2. **Phase 2 – Architecture Planning**: Detailed technical designs, schema contracts, Zod validation schemas, API specifications, and RLS policies are produced before coding.
3. **Phase 3 – Task Breakdown**: Implementation is decomposed into atomic, dependency-ordered tasks with clear verification steps.
4. **Phase 4 – Implementation**: Tasks are executed sequentially against the approved specification. Type checking (`tsc --noEmit`), linting (`eslint`), and responsive UI verification must pass for every task.
5. **Phase 5 – Validation**: Features are reviewed against the constitutional principles, edge quotas, and acceptance criteria before being marked complete.

## Governance

This Constitution is the supreme authority governing the technical and product evolution of the Digital Catalog & QR Platform. All pull requests, code reviews, architectural decisions, and agent interactions must demonstrate strict adherence to its principles.
- Any amendment to this constitution requires explicit documentation of rationale and approval.
- Version increments follow Semantic Versioning (SemVer):
  - **MAJOR**: Structural changes, removal or fundamental redefinition of core principles.
  - **MINOR**: Addition of new principles, sections, or materially expanded governance rules.
  - **PATCH**: Clarifications, formatting corrections, and non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
