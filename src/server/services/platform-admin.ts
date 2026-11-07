import { supabase } from '../db/supabase.ts';
import { RESERVED_SLUGS } from '../tenant/reserved-slugs.ts';
import {
  PlatformKpisSchema,
  type PlatformKpisType,
  ListBusinessesAdminQuerySchema,
  type ListBusinessesAdminQueryInput,
  UpdateSubscriptionAdminSchema,
  type UpdateSubscriptionAdminInputType,
  UpdateBusinessStatusSchema,
  type UpdateBusinessStatusInput,
} from '../../shared/schemas.ts';
import type { BusinessAdminListItem, BusinessStatus } from '../../shared/types.ts';

export interface PlatformAdminServiceOptions {
  superAdminIds?: string[];
}

export class PlatformAdminService {
  private allowedAdminIds: Set<string>;

  constructor(options?: PlatformAdminServiceOptions) {
    const envIds = (process.env.SUPER_ADMIN_USER_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    this.allowedAdminIds = new Set([...envIds, ...(options?.superAdminIds || [])]);
  }

  /**
   * Verifies if a given user ID possesses Super Admin platform privileges.
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    if (!userId || typeof userId !== 'string') {
      return false;
    }

    if (this.allowedAdminIds.has(userId)) {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return true;
      }
    } catch {
      // In sandbox/offline or when table doesn't exist, rely on allowedAdminIds
    }

    return false;
  }

  /**
   * Asserts Super Admin privileges; throws a 403 Forbidden error if unauthorized.
   */
  async assertSuperAdmin(userId: string): Promise<void> {
    const isAuthorized = await this.isSuperAdmin(userId);
    if (!isAuthorized) {
      throw new Error('غير مصرح لك بالوصول إلى لوحة تحكم المنصة (Super Admin required)');
    }
  }

  /**
   * Fetches aggregate platform KPIs (total merchants, active stores, products, scans).
   */
  async getPlatformKpis(userId: string): Promise<PlatformKpisType> {
    await this.assertSuperAdmin(userId);

    try {
      // Businesses counts
      const { data: businesses, error: bizError } = await supabase
        .from('businesses')
        .select('status');

      let totalMerchants = 0;
      let activeStores = 0;
      let suspendedStores = 0;

      if (!bizError && businesses) {
        totalMerchants = businesses.length;
        activeStores = businesses.filter((b) => b.status === 'active').length;
        suspendedStores = businesses.filter((b) => b.status === 'suspended').length;
      }

      // Products count
      const { count: productCount, error: prodError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const totalProducts = !prodError && typeof productCount === 'number' ? productCount : 0;

      // QR Scans count
      const { count: scanCount, error: scanError } = await supabase
        .from('qr_scan_events')
        .select('*', { count: 'exact', head: true });

      const totalQrScans = !scanError && typeof scanCount === 'number' ? scanCount : 0;

      return PlatformKpisSchema.parse({
        totalMerchants,
        activeStores,
        suspendedStores,
        totalProducts,
        totalQrScans,
      });
    } catch {
      // Graceful fallback for mock/offline testing
      return PlatformKpisSchema.parse({
        totalMerchants: 0,
        activeStores: 0,
        suspendedStores: 0,
        totalProducts: 0,
        totalQrScans: 0,
      });
    }
  }

  /**
   * Retrieves paginated and filtered business directory for Super Admin inspection.
   */
  async listBusinesses(
    userId: string,
    query: ListBusinessesAdminQueryInput
  ): Promise<{
    businesses: BusinessAdminListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.assertSuperAdmin(userId);
    const validated = ListBusinessesAdminQuerySchema.parse(query);

    const page = validated.page;
    const limit = validated.limit;
    const offset = (page - 1) * limit;

    try {
      let req = supabase
        .from('businesses')
        .select('id, name, slug, status, plan_code, max_products, max_categories, created_at, subscription_expires_at, admin_notes', {
          count: 'exact',
        });

      if (validated.status) {
        req = req.eq('status', validated.status);
      }

      if (validated.search) {
        req = req.or(`name.ilike.%${validated.search}%,slug.ilike.%${validated.search}%`);
      }

      const { data, count, error } = await req.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      if (error || !data) {
        return {
          businesses: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      const total = count || data.length;
      const totalPages = Math.ceil(total / limit) || 1;

      const businesses: BusinessAdminListItem[] = data.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        status: (b.status || 'active') as BusinessStatus,
        planCode: b.plan_code || 'free',
        maxProducts: b.max_products || 100,
        maxCategories: b.max_categories || 10,
        productCount: 0,
        createdAt: b.created_at,
        subscriptionExpiresAt: b.subscription_expires_at ?? null,
        adminNotes: b.admin_notes ?? null,
      }));

      return {
        businesses,
        total,
        page,
        limit,
        totalPages,
      };
    } catch {
      return {
        businesses: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Updates store operational status (active, suspended, archived).
   */
  async updateBusinessStatus(
    userId: string,
    input: UpdateBusinessStatusInput
  ): Promise<{ id: string; status: BusinessStatus }> {
    await this.assertSuperAdmin(userId);
    const validated = UpdateBusinessStatusSchema.parse(input);

    const { data, error } = await supabase
      .from('businesses')
      .update({
        status: validated.status,
        status_reason: validated.reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.businessId)
      .select('id, status')
      .single();

    if (error || !data) {
      throw new Error(`فشل تحديث حالة المتجر: ${error?.message || 'المتجر غير موجود'}`);
    }

    return {
      id: data.id,
      status: data.status as BusinessStatus,
    };
  }

  /**
   * Manually modifies merchant subscription tier, resource quotas, and offline payment notes.
   */
  async updateBusinessSubscription(
    userId: string,
    input: UpdateSubscriptionAdminInputType
  ): Promise<{
    id: string;
    planCode: string;
    maxProducts: number;
    maxCategories: number;
    subscriptionExpiresAt: string | null;
    adminNotes: string | null;
  }> {
    await this.assertSuperAdmin(userId);
    const validated = UpdateSubscriptionAdminSchema.parse(input);

    const { data, error } = await supabase
      .from('businesses')
      .update({
        plan_code: validated.planCode,
        max_products: validated.maxProducts,
        max_categories: validated.maxCategories,
        subscription_expires_at: validated.subscriptionExpiresAt ?? null,
        admin_notes: validated.adminNotes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.businessId)
      .select('id, plan_code, max_products, max_categories, subscription_expires_at, admin_notes')
      .single();

    if (error || !data) {
      throw new Error(`فشل تحديث اشتراك المتجر: ${error?.message || 'المتجر غير موجود'}`);
    }

    return {
      id: data.id,
      planCode: data.plan_code,
      maxProducts: data.max_products,
      maxCategories: data.max_categories,
      subscriptionExpiresAt: data.subscription_expires_at,
      adminNotes: data.admin_notes,
    };
  }

  /**
   * Returns list of platform reserved slugs governed by Super Admin.
   */
  async getReservedSlugs(userId: string): Promise<string[]> {
    await this.assertSuperAdmin(userId);
    return Array.from(RESERVED_SLUGS).sort();
  }
}
