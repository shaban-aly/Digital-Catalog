# Quickstart Guide: Background Jobs & Data Retention (JOB-001)

## 1. Overview
The Background Jobs engine executes essential data maintenance tasks (analytics compaction, read notification pruning, subscription expiration auditing) idempotently and under a 100% Free-First ($0 budget) architecture.

---

## 2. Usage Examples

### Running Jobs Programmatically
```typescript
import { BackgroundJobsService } from '@/server/services/background-jobs';

const jobsService = new BackgroundJobsService();

// Run analytics compaction (prune raw scans older than 30 days)
const analyticsResult = await jobsService.compactAnalytics({
  retentionDays: 30,
});
// { jobName: 'compact_analytics', status: 'completed', recordsProcessed: 420, durationMs: 145 }

// Prune read notifications older than 90 days
const pruneResult = await jobsService.pruneReadNotifications({
  retentionDays: 90,
});

// Audit subscriptions for expiration
const subResult = await jobsService.checkSubscriptionExpirations();

// Run all scheduled maintenance tasks in one call
const batchResults = await jobsService.runMaintenanceBatch();
```

---

## 3. Running Unit Tests
```bash
node --test tests/unit/background-jobs.test.ts
```
