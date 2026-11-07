# Architecture & Implementation Plan: External Custom Domains (DOM-002)

## 1. Executive Summary
Feature `DOM-002` delivers external custom domain binding for premium merchants. Operating under Free-First ($0 budget) parameters, it gates access to Pro/Enterprise plans, verifies DNS ownership via tokenized TXT challenge records, enforces strict RFC 1123 hostname syntax, and routes traffic at the edge worker.

---

## 2. Constitutional Quality Gates (10/10 Passed)

- [x] **Gate 1: Arabic RTL First**: DNS setup guides, record types (TXT / CNAME), and status badges are rendered in Arabic RTL.
- [x] **Gate 2: Zero Infrastructure Cost**: In-database challenge token verification without requiring paid enterprise SaaS add-ons ($0/mo).
- [x] **Gate 3: Zod 4 Compliance**: Strict Zod 4 schema validation for hostnames and RFC 4122 UUIDs.
- [x] **Gate 4: Pro Tier Entitlement Gate**: Free tier stores are strictly prevented from registering custom domains with an Arabic upgrade prompt.
- [x] **Gate 5: DNS RFC 1123 Syntax Enforcement**: Rejects schemes (`http://`), trailing slashes, paths, uppercase characters, and invalid TLDs.
- [x] **Gate 6: Platform Namespace Shield**: Prevents claiming platform root or subdomains (`*.daleel-al-suez.com`, `*.digitalmenu.*`).
- [x] **Gate 7: Tokenized TXT Challenge Verification**: Issues unique cryptographic token (`dm_verify_<token>`) preventing domain hijacking.
- [x] **Gate 8: Multi-Tenant Hostname Collision Guard**: A domain cannot be claimed if already registered to another active store.
- [x] **Gate 9: TypeScript Strictness**: Full type coverage for `CustomDomainRecord`, `RegisterCustomDomainInput`, and `ResolveCustomDomainResult`.
- [x] **Gate 10: Automated Test Coverage**: Comprehensive test suite using Node 24 native test runner targeting 100% pass rate.

---

## 3. Implementation Steps

1. **Contracts & Shared Schemas**:
   - Add domain schemas to `src/shared/schemas.ts`:
     - `HostnameSchema`, `CustomDomainStatusSchema`, `RegisterCustomDomainSchema`, `VerifyCustomDomainSchema`, `DeleteCustomDomainSchema`.
   - Add domain types to `src/shared/types.ts`.
2. **Custom Domain Service (`src/server/services/custom-domain.ts`)**:
   - `registerCustomDomain(input: RegisterCustomDomainInput)`
   - `verifyCustomDomain(input: VerifyCustomDomainInput)`
   - `resolveCustomDomain(hostname: string)`
   - `deleteCustomDomain(input: DeleteCustomDomainInput)`
   - `listCustomDomains(businessId: string)`
3. **Automated Unit Testing (`tests/unit/external-custom-domains.test.ts`)**:
   - Hostname RFC 1123 syntax validation (valid domains, schemes rejected, paths rejected, invalid TLDs rejected).
   - Pro tier gating (Free tier rejected with Arabic prompt).
   - Platform namespace collision rejection.
   - Token generation and verification challenge matching.
   - Hostname resolution mapping.
4. **Execution & Verification**:
   - Run `node --test tests/unit/external-custom-domains.test.ts`.
   - Run all test suites `node --test tests/unit/*.test.ts`.
   - Run `npx tsc --noEmit`.
   - Mark all tasks in `tasks.md` completed.
   - Update `docs/specifications/feature-registry.md`.
