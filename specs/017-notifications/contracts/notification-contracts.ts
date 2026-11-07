import { z } from 'zod';

export const NotificationTypeSchema = z.enum([
  'quota_warning',
  'subscription_activated',
  'store_status_changed',
  'system_announcement',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSeveritySchema = z.enum(['info', 'warning', 'critical', 'success']);
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>;

export const CreateNotificationSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  recipientUserId: z.string().uuid('معرف المستخدم يجب أن يكون UUID صالح').optional(),
  type: NotificationTypeSchema,
  severity: NotificationSeveritySchema.default('info'),
  titleAr: z
    .string('عنوان الإشعار مطلوب')
    .min(3, 'عنوان الإشعار يجب أن يكون 3 أحرف على الأقل')
    .max(150, 'عنوان الإشعار يجب ألا يتجاوز 150 حرف'),
  bodyAr: z
    .string('نص الإشعار مطلوب')
    .min(5, 'نص الإشعار يجب أن يكون 5 أحرف على الأقل')
    .max(1000, 'نص الإشعار يجب ألا يتجاوز 1000 حرف'),
  actionUrl: z.string().max(255).optional(),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

export const ListNotificationsQuerySchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  unreadOnly: z.boolean().default(false),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type ListNotificationsQueryInput = z.infer<typeof ListNotificationsQuerySchema>;

export const MarkNotificationReadSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  notificationId: z.string('معرف الإشعار مطلوب').uuid('معرف الإشعار يجب أن يكون UUID صالح'),
});
export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;

export const MarkAllNotificationsReadSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  userId: z.string().uuid('معرف المستخدم يجب أن يكون UUID صالح').optional(),
});
export type MarkAllNotificationsReadInput = z.infer<typeof MarkAllNotificationsReadSchema>;
