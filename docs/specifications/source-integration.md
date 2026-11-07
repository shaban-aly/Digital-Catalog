# Source Integration Map

## Consolidated MVP Specification

`001-core-catalog-platform` supplied the original MVP requirements. Its concerns are now owned as follows:

| Original concern | Owning feature |
|---|---|
| Registration, login, initial merchant setup | IDN-001, BIZ-001 |
| Tenant membership and isolation | TEN-001 |
| Categories and curated catalogs | CAT-001 |
| Products, variants, and options | PRD-001 |
| Image compression and storage | MED-001 |
| Free-tier quotas | LMT-001 |
| Publishing and availability | LIF-001 |
| Public browsing, RTL, item details | PUB-001 |
| WhatsApp ordering | COM-001 |
| Permanent QR codes | QR-001 |
| Privacy-safe scan tracking | ANL-001 |
| OpenGraph, sitemap, robots | SEO-001 |
| Merchant-facing composition | MCH-001 |

`001-core-catalog-platform` is no longer the source for new implementation plans. Its remaining plan and tasks files are historical inputs until their tasks are either mapped into an active feature or retired in a later documentation review.

## Dynamic-Subdomain Specification

`002-dynamic-subdomains` is the owner of DOM-001. Its canonical storefront format is now:

`https://{store-slug}.digitalmenu.daleel-al-suez.com/`

The feature records an existing, externally verified platform capability. It must be verified and documented before any enhancement is planned. External custom domains belong only to DOM-002 and are out of scope.

## WhatsApp Cart Draft

`003-whatsapp-cart` remains the active draft for COM-001. It extends the existing single-item WhatsApp handoff with a tenant-isolated multi-item cart. No plan or tasks are created until its specification is approved.
