import { z } from 'zod';

export const PlatformKpisSchema = z.object({
  totalMerchants: z.number().int().nonnegative(),
  activeStores: z.number().int().nonnegative(),
  suspendedStores: z.number().int().nonnegative(),
  totalProducts: z.number().int().nonnegative(),
  totalQrScans: z.number().int().nonnegative(),
});
export type PlatformKpisType = z.infer<typeof PlatformKpisSchema>;

export const ListBusinessesAdminQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'archived']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type ListBusinessesAdminQueryInput = z.infer<typeof ListBusinessesAdminQuerySchema>;

export const UpdateSubscriptionAdminSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  planCode: z.enum(['free', 'pro', 'enterprise'], {
    message: 'كود الباقة غير صالح',
  }),
  maxProducts: z.number().int().positive('الحد الأقصى للمنتجات يجب أن يكون 1 على الأقل'),
  maxCategories: z.number().int().positive('الحد الأقصى للتصنيفات يجب أن يكون 1 على الأقل'),
  subscriptionExpiresAt: z.string().datetime().nullable().optional(),
  adminNotes: z.string().max(500, 'ملاحظات الإدارة يجب ألا تتجاوز 500 حرف').optional(),
});
export type UpdateSubscriptionAdminInputType = z.infer<typeof UpdateSubscriptionAdminSchema>;
