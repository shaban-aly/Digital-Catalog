# Data Model: External Custom Domains (DOM-002)

## 1. Domain Entities & Schemas

### `CustomDomainStatus`
```typescript
export type CustomDomainStatus =
  | 'pending_verification'
  | 'active'
  | 'verification_failed'
  | 'deactivated';
```

### `CustomDomainRecord`
```typescript
export interface CustomDomainRecord {
  id: string;
  businessId: string;
  hostname: string;
  status: CustomDomainStatus;
  verificationToken: string;
  txtChallengeHost: string;
  cnameTarget: string;
  verifiedAt?: string | null;
  createdAt: string;
}
```

### `RegisterCustomDomainInput`
```typescript
export interface RegisterCustomDomainInput {
  businessId: string;
  hostname: string;
  planCode?: string;
}
```

### `ResolveCustomDomainResult`
```typescript
export type ResolveCustomDomainResult =
  | {
      status: 'active';
      businessId: string;
      businessSlug: string;
      hostname: string;
    }
  | {
      status: 'pending_verification';
      hostname: string;
    }
  | {
      status: 'not_found';
      hostname: string;
    };
```
