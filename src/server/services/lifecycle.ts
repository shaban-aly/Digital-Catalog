import { supabase } from '../db/supabase.ts';
import { tenantErrorPages } from '../tenant/error-pages.ts';
import { RESERVED_SLUGS } from '../tenant/reserved-slugs.ts';
import {
  ToggleCatalogPublishSchema,
  UpdateBusinessStatusSchema,
  ResolveStoreAvailabilitySchema,
} from '../../shared/schemas.ts';
import type { BusinessStatus, StoreLifecycleResolution } from '../../shared/types.ts';

export class LifecycleService {
  /**
   * Toggles catalog publication state (Merchant Owner / Admin action)
   */
  async setCatalogPublication(
    businessId: string,
    catalogId: string,
    isPublished: boolean
  ): Promise<{ id: string; is_published: boolean }> {
    const validated = ToggleCatalogPublishSchema.parse({
      catalogId,
      isPublished,
    });

    const { data, error } = await supabase
      .from('catalogs')
      .update({ is_published: validated.isPublished })
      .eq('id', validated.catalogId)
      .eq('business_id', businessId)
      .select('id, is_published')
      .single();

    if (error || !data) {
      throw new Error(`فشل تحديث حالة نشر القائمة: ${error?.message || 'القائمة غير موجودة'}`);
    }

    return {
      id: data.id,
      is_published: data.is_published,
    };
  }

  /**
   * Sets business operational status (Platform Super Admin / Governance action)
   */
  async setBusinessStatus(
    businessId: string,
    status: BusinessStatus,
    reason?: string
  ): Promise<{ id: string; status: BusinessStatus }> {
    const validated = UpdateBusinessStatusSchema.parse({
      businessId,
      status,
      reason,
    });

    const { data, error } = await supabase
      .from('businesses')
      .update({
        status: validated.status,
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
   * Resolves the comprehensive store lifecycle state for edge routing
   * Evaluates reserved slugs, business status, and catalog publication
   */
  async resolveStoreAvailability(businessSlug: string): Promise<StoreLifecycleResolution> {
    const parsed = ResolveStoreAvailabilitySchema.safeParse({ slug: businessSlug });
    if (!parsed.success) {
      return { status: 'not_found', slug: businessSlug };
    }

    const cleanSlug = businessSlug.toLowerCase().trim();

    // 1. Reserved System Subdomain check
    if (RESERVED_SLUGS.has(cleanSlug)) {
      return { status: 'reserved', slug: cleanSlug };
    }

    // 2. Fetch business
    const { data: business, error: bError } = await supabase
      .from('businesses')
      .select('id, name, slug, status')
      .ilike('slug', cleanSlug)
      .maybeSingle();

    if (bError || !business) {
      return { status: 'not_found', slug: cleanSlug };
    }

    const businessStatus = (business.status as BusinessStatus) || 'active';

    // 3. Evaluate operational status
    if (businessStatus === 'suspended') {
      return {
        status: 'suspended',
        businessId: business.id,
        businessName: business.name,
        businessSlug: business.slug,
      };
    }

    if (businessStatus === 'archived') {
      return {
        status: 'archived',
        businessId: business.id,
        businessName: business.name,
        businessSlug: business.slug,
      };
    }

    // 4. Fetch primary catalog for this business
    const { data: catalog, error: cError } = await supabase
      .from('catalogs')
      .select('id, is_published')
      .eq('business_id', business.id)
      .maybeSingle();

    if (cError || !catalog) {
      return { status: 'not_found', slug: cleanSlug };
    }

    if (!catalog.is_published) {
      return {
        status: 'unpublished',
        businessId: business.id,
        businessName: business.name,
        businessSlug: business.slug,
        catalogId: catalog.id,
        isPublished: false,
      };
    }

    return {
      status: 'active',
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
      catalogId: catalog.id,
      isPublished: true,
    };
  }

  /**
   * Renders the corresponding edge Response for a lifecycle resolution.
   * Returns null if store is active (proceed to normal rendering).
   */
  renderLifecycleResponse(resolution: StoreLifecycleResolution, slug: string): Response | null {
    switch (resolution.status) {
      case 'active':
        return null;
      case 'unpublished':
        return tenantErrorPages.unpublished(slug);
      case 'suspended':
      case 'archived':
        return tenantErrorPages.suspended(slug);
      case 'not_found':
        return tenantErrorPages.notFound(slug);
      case 'reserved':
        return tenantErrorPages.reserved();
    }
  }
}

export const lifecycleService = new LifecycleService();

