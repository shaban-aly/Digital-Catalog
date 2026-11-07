import { z } from 'zod';
import { SLUG_REGEX, isReservedSlug } from '../../../src/client/utils/slug-validator';

/**
 * Interface Contracts: Business and Store Management (BIZ-001)
 */

export type IndustryType = 'restaurant' | 'grocery' | 'fashion' | 'services';
export type BusinessStatus = 'active' | 'suspended' | 'maintenance';

export interface BusinessEntity {
  id: string;
  name: string;
  slug: string;
  industryType: IndustryType;
  currencyCode: string;
  phoneNumber?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  planCode: string;
  maxProducts: number;
  maxCategories: number;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchEntity {
  id: string;
  businessId: string;
  name: string;
  isDefault: boolean;
  address?: string | null;
  createdAt: string;
}

export interface SlugAvailabilityResult {
  available: boolean;
  reason?: string;
}

export const createBusinessSchema = z.object({
  name: z
    .string('يرجى إدخال اسم المتجر')
    .trim()
    .min(2, 'اسم المتجر يجب أن يتكون من حرفين على الأقل')
    .max(100, 'اسم المتجر طويل جداً'),
  slug: z
    .string('يرجى إدخال رابط المتجر')
    .trim()
    .toLowerCase()
    .min(3, 'الرابط قصير جداً (3 أحرف على الأقل)')
    .max(63, 'الرابط طويل جداً (63 حرف كحد أقصى)')
    .refine((val) => !val.includes('--'), {
      message: 'لا يمكن استخدام شرطتين متتاليتين في الرابط',
    })
    .regex(SLUG_REGEX, 'الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة واحدة فقط')
    .refine((val) => !isReservedSlug(val), {
      message: 'هذا الرابط محجوز للمنصة ولا يمكن استخدامه',
    }),
  industryType: z.enum(['restaurant', 'grocery', 'fashion', 'services']).default('restaurant'),
  currencyCode: z.string().default('EGP'),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[+0-9\s-]{8,20}$/.test(val), {
      message: 'رقم الهاتف غير صالح',
    }),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2, 'اسم المتجر يجب أن يتكون من حرفين على الأقل').max(100).optional(),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[+0-9\s-]{8,20}$/.test(val), {
      message: 'رقم الهاتف غير صالح',
    }),
  industryType: z.enum(['restaurant', 'grocery', 'fashion', 'services']).optional(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

export interface IBusinessService {
  /**
   * Checks real-time availability and DNS format of a requested slug.
   */
  checkSlugAvailability(slug: string): Promise<SlugAvailabilityResult>;

  /**
   * Creates a business, assigns user as owner, creates default branch and primary catalog.
   */
  createBusiness(userId: string, input: CreateBusinessInput): Promise<BusinessEntity>;

  /**
   * Retrieves the current user's active business profile.
   */
  getBusinessByUserId(userId: string): Promise<BusinessEntity | null>;

  /**
   * Updates an existing business profile (owner action).
   */
  updateBusiness(businessId: string, input: UpdateBusinessInput): Promise<BusinessEntity>;
}
