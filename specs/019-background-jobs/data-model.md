# Data Model: Background Jobs & Data Retention (JOB-001)

## 1. Domain Entities & Schemas

### `BackgroundJobName`
```typescript
export type BackgroundJobName =
  | 'compact_analytics'
  | 'prune_notifications'
  | 'check_subscriptions';
```

### `JobExecutionStatus`
```typescript
export type JobExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';
```

### `JobExecutionRecord`
```typescript
export interface JobExecutionRecord {
  id: string;
  jobName: BackgroundJobName;
  status: JobExecutionStatus;
  startedAt: string;
  completedAt?: string | null;
  recordsProcessed: number;
  errorMessage?: string | null;
}
```

### `RunJobInput`
```typescript
export interface RunJobInput {
  jobName: BackgroundJobName;
  retentionDays?: number;
  dryRun?: boolean;
}
```

### `JobResult`
```typescript
export interface JobResult {
  jobName: BackgroundJobName;
  status: 'completed' | 'failed';
  recordsProcessed: number;
  durationMs: number;
  errorMessage?: string;
}
```
