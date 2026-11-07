import { z } from 'zod';

/**
 * Localized Bilingual String Schema (Arabic mandatory, English optional)
 */
export const LocalizedStringSchema = z.object({
  ar: z.string().trim().min(1, 'النص العربي مطلوب'),
  en: z.string().trim().optional(),
});
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

/**
 * Industry Preset Attributes Schemas
 */
export const RestaurantAttributesSchema = z.object({
  calories: z.number().int().nonnegative().optional(),
  allergens: z.array(z.string()).default([]),
  dietary_tags: z.array(z.string()).default([]), // vegan, vegetarian, gluten-free, halal
  preparation_time_minutes: z.number().int().positive().optional(),
});

export const GroceryAttributesSchema = z.object({
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.enum(['piece', 'kg', 'g', 'pack', 'liter', 'ml']).default('piece'),
  package_weight: z.number().positive().optional(),
  origin_country: z.string().optional(),
});

export const FashionAttributesSchema = z.object({
  material: z.string().optional(),
  care_instructions: z.string().optional(),
  size_chart_url: z.string().url().optional(),
  gender: z.enum(['men', 'women', 'kids', 'unisex']).optional(),
});

/**
 * Product Option Modifier Schemas
 */
export const ProductOptionValueSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  price_delta: z.number().nonnegative().default(0),
  is_default: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});
export type ProductOptionValue = z.infer<typeof ProductOptionValueSchema>;

export const ProductOptionGroupSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: LocalizedStringSchema,
    is_required: z.boolean().default(false),
    min_selections: z.number().int().nonnegative().default(0),
    max_selections: z.number().int().positive().default(1),
    sort_order: z.number().int().default(0),
    values: z.array(ProductOptionValueSchema).min(1, 'مجموعة الخيارات يجب أن تحتوي على خيار واحد على الأقل'),
  })
  .refine((group) => group.min_selections <= group.max_selections, {
    message: 'الحد الأدنى للاختيارات لا يمكن أن يتجاوز الحد الأقصى',
    path: ['min_selections'],
  });
export type ProductOptionGroup = z.infer<typeof ProductOptionGroupSchema>;

/**
 * Product Variant Schema (e.g. Size x Color)
 */
export const ProductVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive('سعر المتغير يجب أن يكون أكبر من صفر'),
  compare_at_price: z.number().positive().optional(),
  is_available: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).default({}), // e.g. { size: 'XL', color: 'Blue' }
  sort_order: z.number().int().default(0),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

/**
 * Product Creation & Update DTO Schema
 */
export const CreateProductInputSchema = z.object({
  category_id: z.string().uuid('معرف التصنيف غير صالح'),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  base_price: z.number().nonnegative('لا يمكن أن يكون السعر سالباً').optional(),
  compare_at_price: z.number().positive().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('piece'),
  status: z.enum(['active', 'out_of_stock', 'archived']).default('active'),
  attributes: z.record(z.string(), z.any()).default({}),
  variants: z.array(ProductVariantSchema).max(10, 'الحد الأقصى للمتغيرات هو 10 متغيرات').default([]),
  option_groups: z.array(ProductOptionGroupSchema).default([]),
  image_urls: z.array(z.string().url()).max(3, 'الحد الأقصى هو 3 صور لكل منتج').default([]),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

/**
 * Category Schema
 */
export const CategoryInputSchema = z.object({
  name: LocalizedStringSchema,
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof CategoryInputSchema>;

export const UpdateCategoryInputSchema = CategoryInputSchema.partial();
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

export const BatchReorderCategoriesSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sort_order: z.number().int().nonnegative(),
  })
);
export type BatchReorderCategoriesInput = z.infer<typeof BatchReorderCategoriesSchema>;

export const CatalogItemInputSchema = z.object({
  catalog_id: z.string().uuid('معرف القائمة غير صالح'),
  product_id: z.string().uuid('معرف المنتج غير صالح'),
  category_id: z.string().uuid('معرف التصنيف غير صالح'),
  price_override: z.number().positive('السعر المعدل يجب أن يكون أكبر من صفر').nullable().optional(),
  sort_order: z.number().int().default(0),
  is_featured: z.boolean().default(false),
  is_available: z.boolean().default(true),
});
export type CatalogItemInput = z.infer<typeof CatalogItemInputSchema>;

export const UpdateCatalogItemInputSchema = z.object({
  category_id: z.string().uuid().optional(),
  price_override: z.number().positive().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_featured: z.boolean().optional(),
  is_available: z.boolean().optional(),
});
export type UpdateCatalogItemInput = z.infer<typeof UpdateCatalogItemInputSchema>;

/**
 * Product Media Management Schemas (MED-001)
 */
export const ProductMediaInputSchema = z.object({
  product_id: z.string().uuid('معرف المنتج غير صالح'),
  storage_path: z.string().min(3, 'مسار الملف غير صالح'),
  public_url: z.string().url('رابط الصورة غير صالح'),
  file_size_bytes: z
    .number()
    .int()
    .positive('حجم الملف غير صالح')
    .max(204800, 'حجم الملف يتجاوز الحد المسموح (200KB)'),
  is_cover: z.boolean().default(false),
  sort_order: z.number().int().nonnegative().default(0),
});
export type ProductMediaInput = z.infer<typeof ProductMediaInputSchema>;

export const UpdateMediaSortSchema = z.array(
  z.object({
    id: z.string().uuid('معرف الصورة غير صالح'),
    sort_order: z.number().int().nonnegative(),
  })
);
export type UpdateMediaSortInput = z.infer<typeof UpdateMediaSortSchema>;

export const SetCoverImageSchema = z.object({
  product_id: z.string().uuid('معرف المنتج غير صالح'),
  media_id: z.string().uuid('معرف الصورة غير صالح'),
});
export type SetCoverImageInput = z.infer<typeof SetCoverImageSchema>;

/**
 * Entitlements & Usage Limits Schemas (LMT-001)
 */
export const UsageMetricsSchema = z.object({
  productCount: z.number().int().nonnegative(),
  maxProducts: z.number().int().positive(),
  productUsagePercent: z.number().min(0).max(100),
  isProductLimitReached: z.boolean(),
  categoryCount: z.number().int().nonnegative(),
  maxCategories: z.number().int().positive(),
  categoryUsagePercent: z.number().min(0).max(100),
  isCategoryLimitReached: z.boolean(),
  planCode: z.enum(['free', 'pro', 'enterprise']),
  planNameAr: z.string(),
});
export type UsageMetrics = z.infer<typeof UsageMetricsSchema>;

export const UpgradeWhatsAppRequestSchema = z.object({
  businessId: z.string().uuid('معرف المتجر غير صالح'),
  businessName: z.string().min(1, 'اسم المتجر مطلوب'),
  requestedPlan: z.enum(['free', 'pro', 'enterprise']),
  paymentMethod: z.enum(['instapay', 'vodafone_cash', 'bank_transfer']),
  whatsappNumber: z.string().default('201012345678'),
});
export type UpgradeWhatsAppRequest = z.infer<typeof UpgradeWhatsAppRequestSchema>;

/**
 * Public Catalog Hydration Payloads
 */
export const PublicProductSchema = z.object({
  id: z.string().uuid(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.nullable(),
  effective_price: z.number(),
  compare_at_price: z.number().nullable(),
  unit: z.string().nullable(),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  cover_image_url: z.string().nullable(),
  gallery_image_urls: z.array(z.string()),
  category_id: z.string().uuid(),
  attributes: z.record(z.string(), z.any()),
  variants: z.array(ProductVariantSchema),
  option_groups: z.array(ProductOptionGroupSchema),
});
export type PublicProduct = z.infer<typeof PublicProductSchema>;

export const PublicCategorySchema = z.object({
  id: z.string().uuid(),
  name: LocalizedStringSchema,
  sort_order: z.number(),
  product_count: z.number(),
});
export type PublicCategory = z.infer<typeof PublicCategorySchema>;

export const PublicCatalogPayloadSchema = z.object({
  business: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    currency_code: z.string(),
    phone_number: z.string().nullable(),
    logo_url: z.string().nullable(),
    cover_url: z.string().nullable(),
    industry_type: z.string(),
  }),
  catalog: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    theme_config: z.record(z.string(), z.any()),
  }),
  categories: z.array(PublicCategorySchema),
  products: z.array(PublicProductSchema),
});
export type PublicCatalogPayload = z.infer<typeof PublicCatalogPayloadSchema>;

/**
 * Store and Catalog Lifecycle Schemas (LIF-001)
 */
export const ToggleCatalogPublishSchema = z.object({
  catalogId: z.string().uuid('معرف القائمة يجب أن يكون UUID صالح'),
  isPublished: z.boolean(),
});
export type ToggleCatalogPublishInput = z.infer<typeof ToggleCatalogPublishSchema>;

export const UpdateBusinessStatusSchema = z.object({
  businessId: z.string().uuid('معرف المتجر يجب أن يكون UUID صالح'),
  status: z.enum(['active', 'suspended', 'archived'], {
    message: 'حالة المتجر غير صالحة',
  }),
  reason: z.string().max(255).optional(),
});
export type UpdateBusinessStatusInput = z.infer<typeof UpdateBusinessStatusSchema>;

export const ResolveStoreAvailabilitySchema = z.object({
  slug: z
    .string()
    .min(3, 'اسم المتجر يجب أن يكون 3 أحرف على الأقل')
    .max(63, 'اسم المتجر يجب ألا يتجاوز 63 حرفاً'),
});
export type ResolveStoreAvailabilityInput = z.infer<typeof ResolveStoreAvailabilitySchema>;

/**
 * Public Catalog WhatsApp Order Details Schema (PUB-001)
 */
export const WhatsAppOrderDetailsSchema = z.object({
  storeName: z.string().min(1, 'اسم المتجر لا يمكن أن يكون فارغاً'),
  storePhone: z.string().min(5, 'رقم الهاتف قصير جداً'),
  productName: z.string().min(1, 'اسم المنتج لا يمكن أن يكون فارغاً'),
  variantName: z.string().optional(),
  selectedOptions: z
    .array(
      z.object({
        groupName: z.string(),
        optionName: z.string(),
        priceDelta: z.number(),
      })
    )
    .optional(),
  totalPrice: z.number().nonnegative('السعر الإجمالي يجب أن يكون صفراً أو موجباً'),
  currency: z.string().default('EGP'),
  catalogUrl: z.string().url('رابط الكتالوج يجب أن يكون URL صالح'),
});
export type WhatsAppOrderDetailsInput = z.infer<typeof WhatsAppOrderDetailsSchema>;

/**
 * QR Code Management Schemas (QR-001)
 */
export const CreateQRCodeSchema = z.object({
  businessId: z.string().uuid('معرف المتجر يجب أن يكون UUID صالح'),
  catalogId: z.string().uuid('معرف القائمة يجب أن يكون UUID صالح').optional(),
});
export type CreateQRCodeInput = z.infer<typeof CreateQRCodeSchema>;

export const ResolveShortCodeSchema = z.object({
  shortCode: z
    .string()
    .min(4, 'رمز QR قصير جداً')
    .max(32, 'رمز QR طويل جداً')
    .regex(/^[a-zA-Z0-9_-]+$/, 'رمز QR يحتوي على أحرف غير صالحة'),
});
export type ResolveShortCodeInput = z.infer<typeof ResolveShortCodeSchema>;

export const QRCodeRecordSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  catalog_id: z.string().uuid(),
  short_code: z.string(),
  is_active: z.boolean(),
  total_scans: z.number().int().nonnegative(),
  created_at: z.string(),
  redirect_url: z.string().url(),
});
export type QRCodeRecordType = z.infer<typeof QRCodeRecordSchema>;

/**
 * Privacy-Safe Analytics Schemas (ANL-001)
 */
export const LogQrScanEventSchema = z.object({
  qrCodeId: z.string().uuid('معرف رمز QR يجب أن يكون UUID صالح'),
  ipAddress: z.string().min(1, 'عنوان IP مطلوب'),
  userAgent: z.string().default(''),
  referrer: z.string().nullable().optional(),
});
export type LogQrScanEventInput = z.infer<typeof LogQrScanEventSchema>;

export const AnalyticsSummarySchema = z.object({
  totalScans: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  totalWhatsAppClicks: z.number().int().nonnegative(),
  uniqueVisitorsEstimate: z.number().int().nonnegative(),
});
export type AnalyticsSummaryType = z.infer<typeof AnalyticsSummarySchema>;

export const GetBusinessMetricsQuerySchema = z.object({
  businessId: z.string().uuid('معرف المتجر يجب أن يكون UUID صالح'),
});
export type GetBusinessMetricsQueryInput = z.infer<typeof GetBusinessMetricsQuerySchema>;

/**
 * SEO & Metadata Schemas (SEO-001)
 */
export const CanonicalUrlSchema = z.object({
  businessSlug: z.string().min(3, 'اسم المتجر قصير جداً').max(63),
  requestHost: z.string().optional(),
});
export type CanonicalUrlInput = z.infer<typeof CanonicalUrlSchema>;

export const SeoMetadataItemSchema = z.object({
  title: z.string().optional(),
  name: z.string().optional(),
  property: z.string().optional(),
  content: z.string().optional(),
});
export type SeoMetadataItem = z.infer<typeof SeoMetadataItemSchema>;

/**
 * Merchant Dashboard Workspace Schemas (MCH-001)
 */
export const DashboardBusinessSummarySchema = z.object({
  id: z.string().uuid('معرف المتجر يجب أن يكون UUID صالح'),
  name: z.string().min(1, 'اسم المتجر مطلوب'),
  slug: z.string().min(3).max(63),
  plan_code: z.string().default('free'),
  max_products: z.number().int().default(100),
  max_categories: z.number().int().default(15),
  subdomainUrl: z.string().url('رابط النطاق الفرعي يجب أن يكون URL صالح'),
  catalogPreviewUrl: z.string(),
});
export type DashboardBusinessSummaryType = z.infer<typeof DashboardBusinessSummarySchema>;

export const DashboardMetricCardSchema = z.object({
  labelAr: z.string().min(1),
  value: z.number().int().nonnegative(),
  isEstimated: z.boolean().default(false),
  icon: z.string(),
  tooltipAr: z.string().optional(),
});
export type DashboardMetricCardType = z.infer<typeof DashboardMetricCardSchema>;

/**
 * WhatsApp Cart & Multi-Item Ordering Schemas (COM-001)
 */
export const CartItemOptionSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  valueId: z.string(),
  optionName: z.string(),
  priceDelta: z.number(),
});
export type CartItemOptionType = z.infer<typeof CartItemOptionSchema>;

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string().uuid('معرف المنتج يجب أن يكون UUID صالح'),
  productName: z.string().min(1, 'اسم المنتج مطلوب'),
  coverImageUrl: z.string().nullable().optional(),
  unitPrice: z.number().nonnegative('سعر الوحدة لا يمكن أن يكون سالباً'),
  quantity: z.number().int().positive('الكمية يجب أن تكون 1 على الأقل'),
  lineTotal: z.number().nonnegative(),
  variantId: z.string().uuid().optional(),
  variantName: z.string().optional(),
  selectedOptions: z.array(CartItemOptionSchema).optional(),
  itemNote: z.string().max(255).optional(),
  isAvailable: z.boolean().optional(),
  priceChanged: z.boolean().optional(),
});
export type CartItemType = z.infer<typeof CartItemSchema>;

export const CustomerCartSchema = z.object({
  storeSlug: z.string().min(1, 'معرف المتجر مطلوب'),
  storeName: z.string().min(1, 'اسم المتجر مطلوب'),
  storePhone: z.string().nullable().optional(),
  currency: z.string().default('EGP'),
  items: z.array(CartItemSchema),
  customerName: z.string().optional(),
  fulfillmentNotes: z.string().optional(),
  totalAmount: z.number().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  updatedAt: z.string(),
  orderSubmitted: z.boolean().optional(),
  submittedAt: z.string().optional(),
});
export type CustomerCartType = z.infer<typeof CustomerCartSchema>;

export const MultiItemOrderSubmissionSchema = z.object({
  storeName: z.string().min(1, 'اسم المتجر مطلوب'),
  storePhone: z.string().min(5, 'رقم هاتف المتجر مطلوب'),
  items: z.array(CartItemSchema).min(1, 'السلة فارغة'),
  customerName: z.string().optional(),
  fulfillmentNotes: z.string().optional(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().default('EGP'),
  catalogUrl: z.string().url('رابط المتجر يجب أن يكون URL صالح'),
});
export type MultiItemOrderSubmissionType = z.infer<typeof MultiItemOrderSubmissionSchema>;

/**
 * Platform Super Admin Schemas (ADM-001)
 */
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
  businessId: z.string().uuid('معرف المتجر يجب أن يكون UUID صالح'),
  planCode: z.enum(['free', 'pro', 'enterprise'], {
    message: 'كود الباقة غير صالح',
  }),
  maxProducts: z.number().int().positive('الحد الأقصى للمنتجات يجب أن يكون 1 على الأقل'),
  maxCategories: z.number().int().positive('الحد الأقصى للتصنيفات يجب أن يكون 1 على الأقل'),
  subscriptionExpiresAt: z.string().datetime().nullable().optional(),
  adminNotes: z.string().max(500, 'ملاحظات الإدارة يجب ألا تتجاوز 500 حرف').optional(),
});
export type UpdateSubscriptionAdminInputType = z.infer<typeof UpdateSubscriptionAdminSchema>;

/**
 * Merchant Notification Schemas (NOT-001)
 */
export const NotificationTypeSchema = z.enum([
  'quota_warning',
  'subscription_activated',
  'store_status_changed',
  'system_announcement',
]);

export const NotificationSeveritySchema = z.enum(['info', 'warning', 'critical', 'success']);

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
export type CreateNotificationInputType = z.infer<typeof CreateNotificationSchema>;

export const ListNotificationsQuerySchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  unreadOnly: z.boolean().default(false),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type ListNotificationsQueryInputType = z.infer<typeof ListNotificationsQuerySchema>;

export const MarkNotificationReadSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  notificationId: z.string('معرف الإشعار مطلوب').uuid('معرف الإشعار يجب أن يكون UUID صالح'),
});
export type MarkNotificationReadInputType = z.infer<typeof MarkNotificationReadSchema>;

export const MarkAllNotificationsReadSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  userId: z.string().uuid('معرف المستخدم يجب أن يكون UUID صالح').optional(),
});
export type MarkAllNotificationsReadInputType = z.infer<typeof MarkAllNotificationsReadSchema>;

/**
 * Audit Logs & Governance History Schemas (AUD-001)
 */
export const AuditActionSchema = z.enum([
  'tenant_role_changed',
  'tenant_member_removed',
  'store_status_changed',
  'subscription_tier_updated',
  'catalog_lifecycle_changed',
  'business_profile_updated',
]);
export type AuditActionType = z.infer<typeof AuditActionSchema>;

export const AuditTargetTypeSchema = z.enum([
  'member',
  'business',
  'catalog',
  'subscription',
  'product',
]);
export type AuditTargetTypeValue = z.infer<typeof AuditTargetTypeSchema>;

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
export type RecordAuditInputType = z.infer<typeof RecordAuditSchema>;

export const ListAuditLogsQuerySchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  action: AuditActionSchema.optional(),
  targetType: AuditTargetTypeSchema.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type ListAuditLogsQueryInputType = z.infer<typeof ListAuditLogsQuerySchema>;

/**
 * Background Jobs & Data Retention Schemas (JOB-001)
 */
export const BackgroundJobNameSchema = z.enum([
  'compact_analytics',
  'prune_notifications',
  'check_subscriptions',
]);
export type BackgroundJobNameType = z.infer<typeof BackgroundJobNameSchema>;

export const JobExecutionStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type JobExecutionStatusType = z.infer<typeof JobExecutionStatusSchema>;

export const RunJobSchema = z.object({
  jobName: BackgroundJobNameSchema,
  retentionDays: z.number().int().positive().default(30),
  dryRun: z.boolean().default(false),
});
export type RunJobInputType = z.infer<typeof RunJobSchema>;

export const JobResultSchema = z.object({
  jobName: BackgroundJobNameSchema,
  status: z.enum(['completed', 'failed']),
  recordsProcessed: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
  errorMessage: z.string().optional(),
});
export type JobResultType = z.infer<typeof JobResultSchema>;

/**
 * Bulk Catalog & Menu Import Schemas (IMP-001)
 */
export const ImportProductRowSchema = z.object({
  categoryNameAr: z
    .string('اسم التصنيف بالعربية مطلوب')
    .min(2, 'اسم التصنيف يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم التصنيف يجب ألا يتجاوز 100 حرف'),
  categoryNameEn: z.string().max(100).optional(),
  nameAr: z
    .string('اسم المنتج بالعربية مطلوب')
    .min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل')
    .max(150, 'اسم المنتج يجب ألا يتجاوز 150 حرف'),
  nameEn: z.string().max(150).optional(),
  descriptionAr: z.string().max(1000).optional(),
  price: z.number().nonnegative('السعر يجب أن يكون 0 أو أكبر'),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url('رابط الصورة غير صالح').optional().or(z.literal('')),
});
export type ImportProductRowType = z.infer<typeof ImportProductRowSchema>;

export const ImportCatalogBatchSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  rows: z
    .array(ImportProductRowSchema)
    .min(1, 'يجب تزويد صف واحد على الأقل للاستيراد')
    .max(500, 'الحد الأقصى للاستيراد في العملية الواحدة هو 500 منتج'),
});
export type ImportCatalogBatchInputType = z.infer<typeof ImportCatalogBatchSchema>;

export const ParseCsvInputSchema = z.object({
  csvContent: z.string('محتوى الملف مطلوب').min(5, 'محتوى الملف قصير جداً'),
});
export type ParseCsvInputType = z.infer<typeof ParseCsvInputSchema>;

/**
 * External Custom Domain Schemas (DOM-002)
 */
export const CustomDomainStatusSchema = z.enum([
  'pending_verification',
  'active',
  'verification_failed',
  'deactivated',
]);
export type CustomDomainStatusType = z.infer<typeof CustomDomainStatusSchema>;

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
export type RegisterCustomDomainInputType = z.infer<typeof RegisterCustomDomainSchema>;

export const VerifyCustomDomainSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  domainId: z.string('معرف النطاق مطلوب').uuid('معرف النطاق يجب أن يكون UUID صالح'),
  simulatedToken: z.string().optional(),
});
export type VerifyCustomDomainInputType = z.infer<typeof VerifyCustomDomainSchema>;

export const DeleteCustomDomainSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  domainId: z.string('معرف النطاق مطلوب').uuid('معرف النطاق يجب أن يكون UUID صالح'),
});
export type DeleteCustomDomainInputType = z.infer<typeof DeleteCustomDomainSchema>;





