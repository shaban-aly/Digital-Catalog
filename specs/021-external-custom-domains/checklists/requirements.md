# Requirements Checklist: External Custom Domains (DOM-002)

- [x] **REQ-001**: Validates hostname string strictly according to DNS RFC 1123 / RFC 1035 rules.
- [x] **REQ-002**: Rejects URL schemes (`http://`, `https://`), trailing slashes, paths, and port numbers.
- [x] **REQ-003**: Rejects platform-owned root domains (`daleel-al-suez.com`, `digitalmenu`) and subdomains.
- [x] **REQ-004**: Enforces Pro/Enterprise tier entitlement; Free tier merchants are barred with upgrade prompt.
- [x] **REQ-005**: Generates cryptographically secure verification token (`dm_verify_<hash>`) for each registered domain.
- [x] **REQ-006**: Provides TXT record challenge format: host `_digitalmenu-challenge.{domain}` with verification token value.
- [x] **REQ-007**: Provides CNAME routing instructions: CNAME target pointing to `custom.digitalmenu.daleel-al-suez.com`.
- [x] **REQ-008**: Domain state lifecycle supports: `pending_verification`, `active`, `verification_failed`, `deactivated`.
- [x] **REQ-009**: Domain verification transition succeeds only when ownership token matches.
- [x] **REQ-010**: Hostname resolver maps active custom hostnames to merchant `business_id` and catalog `slug`.
- [x] **REQ-011**: Unverified or deactivated custom domains are safely blocked from serving storefront traffic.
- [x] **REQ-012**: Domain deletion / deactivation cleanly unlinks the hostname from the store catalog.
- [x] **REQ-013**: All DNS setup instructions, status indicators, and warning alerts are natively Arabic RTL.
- [x] **REQ-014**: Strict multi-tenant isolation prevents claiming a domain registered by another merchant.
- [x] **REQ-015**: Zod 4 schemas validate all custom domain payloads, queries, and mutations.
- [x] **REQ-016**: Unit test suite validates hostname syntax, tier gating, verification challenges, and resolution logic.
