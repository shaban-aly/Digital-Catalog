import { z } from 'zod';

export const CustomDomainStatusSchema = z.enum([
  'pending_verification',
  'active',
  'verification_failed',
  'deactivated',
]);
export type CustomDomainStatus = z.infer<typeof CustomDomainStatusSchema>;

export const HostnameSchema = z
  .string('اسم النطاق مطلوب')
  .min(4, 'اسم النطاق يجب أن يكون 4 أحرف على الأقل')
  .max(253, 'اسم النطاق يجب ألا يتجاوز 253 حرف')
  .toLowerCase()
  .refine(
    (val) => !val.includes('://'),
    'اسم النطاق يجب ألا يحتوي على بروتوكول مثل http:// أو https://'
  )
  .refine((val) => !val.includes('/'), 'اسم النطاق يجب ألا يحتوي على مسارات')
  .refine((val) => !val.includes(':'), 'اسم النطاق يجب ألا يحتوي على منفذ (port)')
  .refine(
    (val) => /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(val),
    'صيغة النطاق غير صالحة. مثال: menu.albaraka.com'
  );

export const RegisterCustomDomainSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  hostname: HostnameSchema,
  planCode: z.string().optional().default('pro'),
});
export type RegisterCustomDomainInput = z.infer<typeof RegisterCustomDomainSchema>;

export const VerifyCustomDomainSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  domainId: z.string('معرف النطاق مطلوب').uuid('معرف النطاق يجب أن يكون UUID صالح'),
  simulatedToken: z.string().optional(),
});
export type VerifyCustomDomainInput = z.infer<typeof VerifyCustomDomainSchema>;

export const DeleteCustomDomainSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  domainId: z.string('معرف النطاق مطلوب').uuid('معرف النطاق يجب أن يكون UUID صالح'),
});
export type DeleteCustomDomainInput = z.infer<typeof DeleteCustomDomainSchema>;
