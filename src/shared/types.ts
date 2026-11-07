export type IndustryType = 'restaurant' | 'grocery' | 'fashion' | 'services';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type BusinessStatus = 'active' | 'suspended' | 'archived';

export type ProductStatus = 'active' | 'out_of_stock' | 'archived';

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry_type: IndustryType;
  currency_code: string;
  phone_number: string | null;
  logo_url: string | null;
  cover_url: string | null;
  status?: BusinessStatus;
  plan_code: string;
  max_products: number;
  max_categories: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  is_default: boolean;
  address: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: { ar: string; en?: string };
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: { ar: string; en?: string };
  sku?: string | null;
  barcode?: string | null;
  price: number;
  compare_at_price?: number | null;
  is_available: boolean;
  attributes: Record<string, string>;
  sort_order: number;
}

export interface ProductOptionValue {
  id: string;
  group_id: string;
  name: { ar: string; en?: string };
  price_delta: number;
  is_default: boolean;
  sort_order: number;
}

export interface ProductOptionGroup {
  id: string;
  product_id: string;
  name: { ar: string; en?: string };
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  sort_order: number;
  values?: ProductOptionValue[];
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  name: { ar: string; en?: string };
  description?: { ar?: string; en?: string } | null;
  base_price?: number | null;
  compare_at_price?: number | null;
  barcode?: string | null;
  sku?: string | null;
  unit?: string | null;
  status: ProductStatus;
  attributes: Record<string, any>;
  variants?: ProductVariant[];
  option_groups?: ProductOptionGroup[];
  media?: ProductMedia[];
  category?: { id: string; name: { ar: string; en?: string } };
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  file_size_bytes: number;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface Catalog {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  is_published: boolean;
  theme_config: Record<string, any>;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  catalog_id: string;
  product_id: string;
  category_id: string;
  price_override?: number | null;
  sort_order: number;
  is_featured: boolean;
  is_available: boolean;
}

export interface QRCode {
  id: string;
  business_id: string;
  catalog_id: string;
  short_code: string;
  is_active: boolean;
  total_scans: number;
  created_at: string;
}

export interface CreateQRCodeParams {
  businessId: string;
  catalogId?: string;
}

export interface QRCodeRecord {
  id: string;
  business_id: string;
  catalog_id: string;
  short_code: string;
  is_active: boolean;
  total_scans: number;
  created_at: string;
  redirect_url: string;
}

export interface QRDestinationResult {
  destinationUrl: string;
  qrId: string;
}

/**
 * Privacy-Safe Analytics Types (ANL-001)
 */
export interface AnalyticsSummary {
  totalScans: number;
  totalViews: number;
  totalWhatsAppClicks: number;
  uniqueVisitorsEstimate: number;
}

export interface LogQrScanEventParams {
  qrCodeId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string | null;
}

/**
 * Plan & Usage Limits Types (LMT-001)
 */
export type PlanCode = 'free' | 'pro' | 'enterprise';

export interface PlanTierConfig {
  code: PlanCode;
  nameAr: string;
  nameEn: string;
  priceMonthlyEgp: number;
  maxProducts: number;
  maxCategories: number;
  maxImagesPerProduct: number;
  features: string[];
  isPopular?: boolean;
}

export interface PaymentChannel {
  id: string;
  type: 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'card_gateway';
  titleAr: string;
  titleEn: string;
  details: string;
  accountHolder?: string;
  isAutomated: boolean;
  badgeAr?: string;
}

export interface UsageMetrics {
  productCount: number;
  maxProducts: number;
  productUsagePercent: number;
  isProductLimitReached: boolean;
  categoryCount: number;
  maxCategories: number;
  categoryUsagePercent: number;
  isCategoryLimitReached: boolean;
  planCode: PlanCode;
  planNameAr: string;
}

export interface UpgradeWhatsAppRequest {
  businessId: string;
  businessName: string;
  requestedPlan: PlanCode;
  paymentMethod: 'instapay' | 'vodafone_cash' | 'bank_transfer';
  whatsappNumber?: string;
}

/**
 * Store and Catalog Lifecycle Types (LIF-001)
 */
export type StoreLifecycleResolution =
  | {
      status: 'active';
      businessId: string;
      businessName: string;
      businessSlug: string;
      catalogId: string;
      isPublished: true;
    }
  | {
      status: 'unpublished';
      businessId: string;
      businessName: string;
      businessSlug: string;
      catalogId: string;
      isPublished: false;
    }
  | {
      status: 'suspended';
      businessId: string;
      businessName: string;
      businessSlug: string;
      reason?: string;
    }
  | {
      status: 'archived';
      businessId: string;
      businessName: string;
      businessSlug: string;
    }
  | {
      status: 'not_found';
      slug: string;
    }
  | {
      status: 'reserved';
      slug: string;
    };

export interface PlatformKpis {
  totalMerchants: number;
  activeStores: number;
  suspendedStores: number;
  totalProducts: number;
  totalQrScans: number;
}

export interface BusinessAdminListItem {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  planCode: string;
  maxProducts: number;
  maxCategories: number;
  productCount: number;
  createdAt: string;
  subscriptionExpiresAt?: string | null;
  adminNotes?: string | null;
}

export interface UpdateSubscriptionAdminInput {
  businessId: string;
  planCode: 'free' | 'pro' | 'enterprise';
  maxProducts: number;
  maxCategories: number;
  subscriptionExpiresAt?: string | null;
  adminNotes?: string;
}

export interface ListBusinessesAdminQuery {
  search?: string;
  status?: BusinessStatus;
  page?: number;
  limit?: number;
}

export type NotificationType =
  | 'quota_warning'
  | 'subscription_activated'
  | 'store_status_changed'
  | 'system_announcement';

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface MerchantNotification {
  id: string;
  businessId: string;
  recipientUserId?: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  titleAr: string;
  bodyAr: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  businessId: string;
  recipientUserId?: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  titleAr: string;
  bodyAr: string;
  actionUrl?: string;
}

export interface ListNotificationsQuery {
  businessId: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface MarkNotificationReadInput {
  businessId: string;
  notificationId: string;
}

export interface MarkAllNotificationsReadInput {
  businessId: string;
  userId?: string;
}

export type AuditAction =
  | 'tenant_role_changed'
  | 'tenant_member_removed'
  | 'store_status_changed'
  | 'subscription_tier_updated'
  | 'catalog_lifecycle_changed'
  | 'business_profile_updated';

export type AuditTargetType = 'member' | 'business' | 'catalog' | 'subscription' | 'product';

export interface AuditLogRecord {
  id: string;
  businessId: string;
  actorId?: string | null;
  actorRole: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface RecordAuditInput {
  businessId: string;
  actorId?: string;
  actorRole: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface ListAuditLogsQuery {
  businessId: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  page?: number;
  limit?: number;
}

export type BackgroundJobName =
  | 'compact_analytics'
  | 'prune_notifications'
  | 'check_subscriptions';

export type JobExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface JobExecutionRecord {
  id: string;
  jobName: BackgroundJobName;
  status: JobExecutionStatus;
  startedAt: string;
  completedAt?: string | null;
  recordsProcessed: number;
  errorMessage?: string | null;
}

export interface RunJobInput {
  jobName: BackgroundJobName;
  retentionDays?: number;
  dryRun?: boolean;
}

export interface JobResult {
  jobName: BackgroundJobName;
  status: 'completed' | 'failed';
  recordsProcessed: number;
  durationMs: number;
  errorMessage?: string;
}

export interface ImportProductRow {
  categoryNameAr: string;
  categoryNameEn?: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  price: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface ImportRowValidationError {
  rowNumber: number;
  field?: string;
  message: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  categoriesToCreate: string[];
  errors: ImportRowValidationError[];
  canProceed: boolean;
  quotaWarning?: string;
}

export interface ImportExecutionResult {
  categoriesCreated: number;
  productsCreated: number;
  failedCount: number;
  durationMs: number;
}

export type CustomDomainStatus =
  | 'pending_verification'
  | 'active'
  | 'verification_failed'
  | 'deactivated';

export interface CustomDomainRecord {
  id: string;
  businessId: string;
  hostname: string;
  status: CustomDomainStatus;
  verificationToken: string;
  txtChallengeHost: string;
  cnameTarget: string;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface RegisterCustomDomainInput {
  businessId: string;
  hostname: string;
  planCode?: string;
}

export interface VerifyCustomDomainInput {
  businessId: string;
  domainId: string;
  simulatedToken?: string;
}

export interface DeleteCustomDomainInput {
  businessId: string;
  domainId: string;
}

export type ResolveCustomDomainResult =
  | {
      status: 'active';
      businessId: string;
      businessSlug: string;
      hostname: string;
    }
  | {
      status: 'pending_verification';
      hostname: string;
    }
  | {
      status: 'not_found';
      hostname: string;
    };

/**
 * WhatsApp Cart & Multi-Item Ordering Domain Models (COM-001)
 */
export interface CartItemOption {
  groupId: string;
  groupName: string;
  valueId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  coverImageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  variantId?: string;
  variantName?: string;
  selectedOptions?: CartItemOption[];
  itemNote?: string;
  isAvailable?: boolean;
  priceChanged?: boolean;
}

export interface CustomerCart {
  storeSlug: string;
  storeName: string;
  storePhone?: string | null;
  currency: string;
  items: CartItem[];
  customerName?: string;
  fulfillmentNotes?: string;
  totalAmount: number;
  totalQuantity: number;
  updatedAt: string;
  orderSubmitted?: boolean;
  submittedAt?: string;
}

export interface MultiItemOrderSubmission {
  storeName: string;
  storePhone: string;
  items: CartItem[];
  customerName?: string;
  fulfillmentNotes?: string;
  totalAmount: number;
  currency: string;
  catalogUrl: string;
}

export interface TenantResolutionResult {
  /** True when the host is a tenant business subdomain (not platform root, not reserved) */
  isTenantSubdomain: boolean;
  /** The extracted subdomain label (lowercase), or null if not a tenant subdomain */
  tenantSlug: string | null;
  /** True when the host is the main platform domain (digitalmenu.*, localhost, workers.dev) */
  isPlatformRoot: boolean;
  /** True when the subdomain is in the reserved list or is a multi-level subdomain */
  isReserved: boolean;
  /** The normalized (lowercase, no trailing dot) hostname */
  normalizedHost: string;
}

export interface SlugValidationResult {
  valid: boolean;
  slug: string;
  error?: string;
  isReserved?: boolean;
  isTaken?: boolean;
}






