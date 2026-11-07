<!--
Sync Impact Report
Version change: 1.2.0 → 1.3.0
Modified principles: 
  - Expanded Principle I (Spec-Driven & Plan-First) to mandate the Modular Feature Registry and ban monolithic mega-specifications.
  - Aligned Development Workflow with the 7-stage lifecycle (Specify -> Clarify -> Plan -> Tasks -> Analyze -> Implement -> Validate).
Added sections: 
  - Principle X: Modular Feature Decomposition & Dependency Governance (Formalizing docs/specifications/ registry, dependency mapping, and boundary draft lifecycle).
Removed sections: None
Follow-up TODOs: None
-->

# Digital Catalog & QR Platform Constitution

## Core Principles

### I. Spec-Driven & Plan-First (NON-NEGOTIABLE)
No feature implementation, database migration, or application code may be written without an approved specification (`spec.md`), technical architecture plan (`plan.md`), and dependency-ordered tasks (`tasks.md`). Every change must trace directly to an accepted user story and acceptance criteria. Monolithic mega-specifications combining multiple business domains are strictly banned; all work must be scoped to atomic, independently reviewable features registered in `docs/specifications/feature-registry.md`. Ad-hoc development and scope creep outside approved task boundaries are strictly prohibited.

### II. Free-First & Zero-Cost Guardrails
The platform is designed to operate reliably at $0 monthly infrastructure cost during the launch phase. Every architectural and code decision MUST respect Cloudflare Workers Free quotas (100k requests/day, 10ms CPU time) and Supabase Free limits (500MB DB, 1GB Storage, 2GB Egress). Client-side WebP compression (<100KB, max 1080px), Cloudflare CDN edge caching for public catalogs and images, and atomic PostgreSQL quota locks are non-negotiable architectural mandates.

### III. Single Source of Truth for Security & Multi-Tenancy
PostgreSQL Row Level Security (RLS) is the supreme, unbypassable security boundary. Client-side route guards and UI state checks are strictly for UX flow and are never considered security mechanisms. Authentication is managed via Supabase Auth (JWT). Multi-tenant isolation is strictly enforced at the database layer using `tenant_id` / `business_id`. The Supabase Service Role Key is strictly barred from client-side bundles and public runtime code; its use is restricted exclusively to isolated background administrative scripts and system webhooks.

### IV. Mobile-First & Edge-Rendered Public Experience
The public catalog is the core consumer-facing product and must achieve sub-second perceived load times on mobile networks. Public catalog routes (`/c/:catalogSlug`) MUST be Server-Side Rendered (SSR) on Cloudflare Workers and cached at Cloudflare CDN edge nodes. Every merchant catalog is accessible via its dedicated platform subdomain (`https://{store-slug}.digitalmenu.daleel-al-suez.com/`) with edge URL rewriting, dynamic OpenGraph preview cards for WhatsApp/social sharing, canonical links to the merchant subdomain, and valid Schema.org JSON-LD structured data.

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

### VIII. Database Architecture & Migration Governance (NON-NEGOTIABLE)
The database operates under a strict single-schema (`public`), multi-tenant shared PostgreSQL architecture. Structural evolution is governed by immutable, incremental, timestamped migrations managed via the Supabase CLI (`supabase/migrations/<YYYYMMDDHHMMSS>_<domain>_<action>.sql`). 
- Monolithic SQL files and unversioned dashboard edits are strictly prohibited.
- Data models must be classified into the 13 defined Logical Domains (`core`, `tenant`, `branch`, `category`, `product`, `media`, `catalog`, `publish`, `analytics`, `limits`, `commerce`, `notify`, `import`).
- Migrations must be cohesive: related changes are grouped, large features are decomposed into ordered migrations, and one-liner trivial statements are avoided.
- Once applied, migrations are permanently immutable.
- Development seeds (`supabase/seed.sql`) must remain strictly isolated from schema DDL migrations.
- Every table MUST enforce Row Level Security (RLS) with explicit tenant scoping (`business_id`).
- TypeScript database types MUST be regenerated (`supabase gen types typescript`) upon every schema modification.

### IX. Agent Governance, Human Approval & Task Scoping (NON-NEGOTIABLE)
All automated agents, subagents, and AI assistants operating in the codebase must adhere to strict governance rules:
- **Mandatory Human Approval Matrix**: Explicit user confirmation is strictly required prior to:
  1. Any database schema DDL modification, migration execution, or table alteration.
  2. Any dependency addition, removal, or version bump in `package.json`.
  3. Any Cloudflare DNS record, Worker route, or Custom Domain modification.
  4. Any Git commit, push, branch creation, or history alteration.
  5. Any architectural or constitutional deviation from approved specifications.
  Silence or ambiguous responses MUST NOT be interpreted as consent.
- **Strict Task Scoping & Anti-Hallucination**: Every delegated task must declare an explicit objective, allowed files, forbidden actions, and acceptance criteria. Agents must operate strictly within assigned files and stop immediately if out-of-scope modifications are required. Fact-checking against actual codebase files is mandatory; no phantom tables, APIs, or libraries may be hallucinated.
- **OpenCode Delegation & Cost Preservation**: The primary model context window is preserved for architecture, planning, and review. Atomic, low-risk, read-only tasks (exploration, test drafting, code auditing) must be delegated to available free/low-cost OpenCode models with strictly enforced tool permissions (`edit: deny` for read-only agents).

### X. Modular Feature Decomposition & Dependency Governance (NON-NEGOTIABLE)
The platform architecture is decomposed into atomic, single-responsibility features tracked in `docs/specifications/feature-registry.md` with strict delivery ordering governed by `docs/specifications/dependency-map.md`:
- **Single Source of Scope**: Every feature folder (`specs/###-<feature-name>`) owns exactly one discrete business capability with a stable Feature ID (e.g., `IDN-001`, `TEN-001`, `BIZ-001`, `DOM-001`). Monolithic specifications (such as legacy `001-core-catalog-platform`) are superseded and serve as historical references only.
- **Strict Dependency Ordering**: Upstream contracts (Identity, Tenant Authorization, Business Ownership) MUST be established and verified before dependent downstream features (Merchant Workspace, Platform Admin, Bulk Import) may advance to planning or implementation.
- **Boundary Draft Quarantine**: A specification in "Boundary Draft" status defines product scope and interfaces only. It is strictly forbidden to generate technical architecture plans (`plan.md`) or implementation tasks (`tasks.md`) for a feature until its specification is formally approved and its prerequisite dependencies are satisfied.
- **Decoupled Cross-Cutting Controls**: Shared product decisions (RTL design tokens, edge caching, RLS security boundary, URL architecture, and free-tier quotas) are governed centrally by this Constitution and `docs/specifications/platform-overview.md`, and MUST NOT be duplicated into individual feature specifications.

## Technical Stack & Infrastructure Constraints

- **Full-Stack Framework**: React 19, TypeScript (strict mode), TanStack Start.
- **Routing & State**: TanStack Router (type-safe file-based routing), TanStack Query (server state), TanStack Form (form state), TanStack Table (data grids).
- **Deployment & Edge Engine**: Cloudflare Workers via `@cloudflare/vite-plugin`, `@tanstack/react-start/plugin/vite`, and `wrangler.jsonc`.
- **Domain & Subdomain Architecture**:
  - Central Platform Domain: `https://digitalmenu.daleel-al-suez.com/` (Landing, Auth, Merchant Dashboard).
  - Merchant Subdomain Pattern: `https://{store-slug}.digitalmenu.daleel-al-suez.com/` (Public Storefront & SSR Catalogs).
  - Cloudflare Wildcard Route: `*.digitalmenu.daleel-al-suez.com/*` pointing to `digital-catalog` Worker with fail-closed policy.
  - Complete Isolation: Apex `daleel-al-suez.com`, `www`, and `tools.daleel-al-suez.com` are strictly preserved on Vercel and never intercepted.
  - Fallback: `*.workers.dev` retained strictly for internal staging previews.
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Supabase Storage.
  - Communication from Workers: HTTPS / PostgREST (stateless, zero connection pool exhaustion).
  - Storage Interface: `IStorageProvider` abstraction for future migration to Cloudflare R2 without business logic changes.
- **Backup & Disaster Recovery**:
  - Automated daily `pg_dump` executed via GitHub Actions.
  - Mandatory client-side encryption (AES-256 via `age`/`gpg`) before leaving the runner.
  - Encrypted archives uploaded directly to a private Cloudflare R2 bucket (10GB free tier). No merchant data in GitHub Releases.

## Development Workflow & Quality Gates

The engineering lifecycle strictly follows the Spec Kit discipline: `Specify -> Clarify -> Plan -> Tasks -> Analyze -> Implement -> Validate`.

1. **Stage 1 – Specify (`/speckit-specify`)**: Features are scoped to discrete business needs with prioritized user journeys (P1, P2, P3), functional requirements, edge cases, and measurable, technology-agnostic success criteria.
2. **Stage 2 – Clarify (`/speckit-clarify`)**: Underspecified requirements and ambiguous stakeholder choices are systematically resolved via targeted clarification questions.
3. **Stage 3 – Plan (`/speckit-plan`)**: Detailed technical architecture, data model modifications, Zod schemas, PostgREST queries, and RLS policies are formulated. Every database modification MUST include a mandatory Database Impact assessment matching the 13 logical domains.
4. **Stage 4 – Tasks (`/speckit-tasks`)**: Implementation plans are decomposed into atomic, dependency-ordered tasks with explicit verification commands and zero unsequenced work.
5. **Stage 5 – Analyze (`/speckit-analyze`)**: Cross-artifact consistency and quality analysis across `spec.md`, `plan.md`, and `tasks.md` is executed before any code is touched.
6. **Stage 6 – Implement (`/speckit-implement`)**: Tasks are executed sequentially with continuous validation (`tsc --noEmit`, `eslint`, RLS tests, responsive RTL UX review).
7. **Stage 7 – Validate & Converge (`/speckit-converge`)**: Implementation is verified against constitutional guardrails, edge latency budgets, and acceptance criteria.

## Governance

This Constitution is the supreme authority governing the technical and product evolution of the Digital Catalog & QR Platform. All pull requests, code reviews, architectural decisions, and agent interactions must demonstrate strict adherence to its principles.
- Any amendment to this constitution requires explicit documentation of rationale and approval.
- Version increments follow Semantic Versioning (SemVer):
  - **MAJOR**: Structural changes, removal or fundamental redefinition of core principles.
  - **MINOR**: Addition of new principles, sections, or materially expanded governance rules.
  - **PATCH**: Clarifications, formatting corrections, and non-semantic refinements.

**Version**: 1.3.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-06
