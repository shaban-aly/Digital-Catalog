# Technical Research: External Custom Domains (DOM-002)

## 1. DNS Verification Patterns Under Free-First ($0 Budget)

In SaaS multi-tenancy:
- **Ownership Hijacking Risk**: A malicious tenant might claim a high-profile domain they do not own (e.g. `google.com` or a competitor's domain) in an attempt to intercept traffic or TLS requests.
- **Challenge-Response Verification**:
  - The platform issues a unique verification token `dm_verify_<random_32_hex_chars>`.
  - The merchant adds a DNS TXT record at `_digitalmenu-challenge.theirdomain.com`.
  - The platform verifies the TXT record before activating the domain.
  - This guarantees that only the legitimate DNS zone owner can bind the custom domain.

## 2. Hostname Resolution at the Edge

- In `DOM-001`, incoming requests are evaluated for platform subdomains (`*.digitalmenu.daleel-al-suez.com`).
- For external custom domains, when `request.headers.get('host')` is neither a platform root nor a platform subdomain:
  - The edge worker queries `custom_domains` by `hostname = :host AND status = 'active'`.
  - If found, it extracts `business_id` and serves the public catalog identically to a platform subdomain.
  - If not found or `pending_verification`, it renders an Arabic domain configuration landing screen.
