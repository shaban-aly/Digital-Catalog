# Tasks: External Custom Domains (DOM-002)

## Phase 1: Contracts & Shared Schemas Alignment
- [x] **TASK-001**: Align domain schemas in `specs/021-external-custom-domains/contracts/domain-contracts.ts` and `src/shared/schemas.ts`.
- [x] **TASK-002**: Align domain types in `src/shared/types.ts`.

## Phase 2: Core Custom Domain Service Implementation
- [x] **TASK-003**: Implement `CustomDomainService` in `src/server/services/custom-domain.ts`:
  - `registerCustomDomain(input: RegisterCustomDomainInput): Promise<CustomDomainRecord>`
  - `verifyCustomDomain(input: VerifyCustomDomainInput): Promise<CustomDomainRecord>`
  - `resolveCustomDomain(hostname: string): Promise<ResolveCustomDomainResult>`
  - `deleteCustomDomain(input: DeleteCustomDomainInput): Promise<{ id: string, deleted: boolean }>`
  - `listCustomDomains(businessId: string): Promise<CustomDomainRecord[]>`

## Phase 3: Automated Testing & Verification
- [x] **TASK-004**: Create comprehensive test suite `tests/unit/external-custom-domains.test.ts` covering:
  - RFC 1123 hostname validation (valid domains, schemes, paths, port numbers).
  - Pro tier entitlement enforcement (Free tier blocked).
  - Platform domain collision rejection.
  - DNS TXT token challenge verification.
  - Edge hostname resolution.
  - Multi-tenant domain isolation.
- [x] **TASK-005**: Run all test suites: `node --test tests/unit/*.test.ts`.
- [x] **TASK-006**: Verify strict TypeScript compilation with zero errors: `npx tsc --noEmit`.
- [x] **TASK-007**: Update `docs/specifications/feature-registry.md` marking `DOM-002` as `Implemented & Verified`.
