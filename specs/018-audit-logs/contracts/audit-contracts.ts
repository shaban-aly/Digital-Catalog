import { z } from 'zod';

export const AuditActionSchema = z.enum([
  'tenant_role_changed',
  'tenant_member_removed',
  'store_status_changed',
  'subscription_tier_updated',
  'catalog_lifecycle_changed',
  'business_profile_updated',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditTargetTypeSchema = z.enum([
  'member',
  'business',
  'catalog',
  'subscription',
  'product',
]);
export type AuditTargetType = z.infer<typeof AuditTargetTypeSchema>;

export const RecordAuditSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  actorId: z.string().uuid('معرف المنفذ يجب أن يكون UUID صالح').optional(),
  actorRole: z.string().min(1, 'دور المنفذ مطلوب').default('owner'),
  action: AuditActionSchema,
  targetType: AuditTargetTypeSchema,
  targetId: z.string().min(1, 'معرف الهدف مطلوب'),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().max(45).optional(),
});
export type RecordAuditInput = z.infer<typeof RecordAuditSchema>;

export const ListAuditLogsQuerySchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  action: AuditActionSchema.optional(),
  targetType: AuditTargetTypeSchema.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type ListAuditLogsQueryInput = z.infer<typeof ListAuditLogsQuerySchema>;
