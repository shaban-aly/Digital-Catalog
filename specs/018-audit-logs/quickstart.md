# Quickstart Guide: Audit Logs & Governance History (AUD-001)

## 1. Overview
The Audit Log service provides an append-only, tenant-isolated audit trail for recording and inspecting sensitive administrative actions (role modifications, membership revocations, store suspensions, and quota upgrades).

---

## 2. Usage Examples

### Using AuditLogService
```typescript
import { AuditLogService } from '@/server/services/audit-log';

const auditService = new AuditLogService();
const businessId = '123e4567-e89b-12d3-a456-426614174000';
const actorUserId = 'a0000000-0000-4000-8000-000000000001';

// Record a sensitive administrative action (e.g. role update)
await auditService.recordEvent({
  businessId,
  actorId: actorUserId,
  actorRole: 'owner',
  action: 'tenant_role_changed',
  targetType: 'member',
  targetId: 'b0000000-0000-4000-8000-000000000002',
  details: {
    previousRole: 'editor',
    newRole: 'admin',
  },
});

// Query audit records (restricted to Owner / Admin)
const { logs, total, totalPages } = await auditService.listLogs(
  actorUserId,
  'owner',
  {
    businessId,
    page: 1,
    limit: 20,
  }
);
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/audit-logs.test.ts
```
