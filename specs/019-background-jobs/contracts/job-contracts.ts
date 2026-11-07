import { z } from 'zod';

export const BackgroundJobNameSchema = z.enum([
  'compact_analytics',
  'prune_notifications',
  'check_subscriptions',
]);
export type BackgroundJobName = z.infer<typeof BackgroundJobNameSchema>;

export const JobExecutionStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type JobExecutionStatus = z.infer<typeof JobExecutionStatusSchema>;

export const RunJobSchema = z.object({
  jobName: BackgroundJobNameSchema,
  retentionDays: z.number().int().positive().default(30),
  dryRun: z.boolean().default(false),
});
export type RunJobInput = z.infer<typeof RunJobSchema>;

export const JobResultSchema = z.object({
  jobName: BackgroundJobNameSchema,
  status: z.enum(['completed', 'failed']),
  recordsProcessed: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
  errorMessage: z.string().optional(),
});
export type JobResult = z.infer<typeof JobResultSchema>;
