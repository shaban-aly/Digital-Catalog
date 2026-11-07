# Feature Dependencies and Delivery Order

## Dependency Map

```mermaid
flowchart LR
  IDN[IDN-001 Identity] --> TEN[TEN-001 Tenant authorization]
  TEN --> BIZ[BIZ-001 Business management]
  BIZ --> CAT[CAT-001 Catalog management]
  CAT --> PRD[PRD-001 Products]
  PRD --> MED[MED-001 Media]
  BIZ --> LMT[LMT-001 Usage limits]
  CAT --> LIF[LIF-001 Lifecycle]
  PRD --> PUB[PUB-001 Public catalog]
  LIF --> PUB
  BIZ --> DOM[DOM-001 Platform subdomains]
  PUB --> DOM
  PUB --> QR[QR-001 QR management]
  QR --> ANL[ANL-001 Analytics]
  PUB --> SEO[SEO-001 SEO]
  DOM --> SEO
  PUB --> COM[COM-001 WhatsApp ordering]
  IDN --> MCH[MCH-001 Merchant dashboard]
  PRD --> MCH
  ANL --> MCH
  TEN --> ADM[ADM-001 Platform admin]
  TEN --> AUD[AUD-001 Audit log]
  COM --> NOT[NOT-001 Notifications]
  ANL --> JOB[JOB-001 Background jobs]
  PRD --> IMP[IMP-001 Bulk import]
  DOM --> EXT[DOM-002 External domains]
```

## Recommended Documentation and Delivery Sequence

1. Confirm identity, authorization, business ownership, catalog, product, and lifecycle contracts.
2. Verify the public catalog, QR, and existing platform-subdomain behavior against those contracts.
3. Define analytics, SEO, and merchant-dashboard gaps.
4. Complete the WhatsApp cart specification before creating its plan.
5. Defer administration, notifications, audit logs, background jobs, import, and external domains until their prerequisite contracts are stable.

## Safe Parallel Work

- Media and usage-limit specifications can be refined after product and business ownership are agreed.
- SEO can be refined alongside public-catalog verification once the canonical merchant URL is fixed.
- Merchant-dashboard documentation can proceed alongside public-catalog documentation because it consumes established feature contracts.
- Future-feature boundary drafts can be reviewed independently. They must not create implementation plans before their dependencies are approved.
