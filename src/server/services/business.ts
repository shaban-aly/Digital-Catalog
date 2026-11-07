import { supabase } from '../db/supabase.ts';
import type { Business, IndustryType } from '../../shared/types.ts';
import { validateSlugFormat, normalizeSlug } from '../../client/utils/slug-validator.ts';

export interface CreateBusinessInput {
  name: string;
  slug: string;
  industryType?: IndustryType;
  currencyCode?: string;
  phoneNumber?: string;
}

export interface UpdateBusinessInput {
  name?: string;
  phoneNumber?: string | null;
  industryType?: IndustryType;
  currencyCode?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export class BusinessService {
  /**
   * Checks whether a slug is available for a new merchant subdomain.
   * Runs local RFC 1123 & reserved word checks first, then verifies DB uniqueness.
   */
  async checkSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
    const cleanSlug = slug.toLowerCase().trim();

    // 1. Client-side DNS RFC 1123 format & reserved slug check
    const formatValidation = validateSlugFormat(cleanSlug);
    if (!formatValidation.valid) {
      return { available: false, reason: formatValidation.error };
    }

    // 2. Query DB RPC if available
    try {
      const { data: isAvailable, error } = await supabase.rpc('is_slug_available', { p_slug: cleanSlug });
      if (!error && typeof isAvailable === 'boolean') {
        return {
          available: isAvailable,
          reason: isAvailable ? undefined : 'هذا الرابط مسجل لمتجر آخر',
        };
      }
    } catch {
      // Fallback to table queries if RPC is not yet applied
    }

    // 3. Fallback: query businesses table directly
    try {
      const { data: existing, error } = await supabase
        .from('businesses')
        .select('id')
        .ilike('slug', cleanSlug)
        .maybeSingle();

      if (error) {
        console.warn('Database slug query warning:', error.message);
      }

      if (existing) {
        return { available: false, reason: 'هذا الرابط مسجل لمتجر آخر' };
      }
    } catch {
      // Return available if offline / fallback
    }

    return { available: true };
  }

  /**
   * Initializes a new business profile and its default branch for an authenticated merchant.
   * Enforces atomic provisioning and compensating rollback if any step fails.
   */
  async createBusiness(userId: string, input: CreateBusinessInput): Promise<Business> {
    const { name, slug, industryType = 'restaurant', currencyCode = 'EGP', phoneNumber } = input;

    // Normalize and validate slug
    const cleanSlug = normalizeSlug(slug);
    const validation = validateSlugFormat(cleanSlug);
    if (!validation.valid) {
      throw new Error(validation.error || 'رابط المتجر غير صالح');
    }

    // 0. Try Atomic RPC procedure first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_merchant_business', {
        p_name: name,
        p_slug: cleanSlug,
        p_industry_type: industryType,
        p_currency_code: currencyCode,
        p_phone_number: phoneNumber || null,
      });

      if (!rpcError && rpcData) {
        return rpcData as unknown as Business;
      }
    } catch {
      // Continue to multi-table creation fallback
    }

    // 1. Direct Table Inserts Fallback with Compensating Rollback
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name,
        slug: cleanSlug,
        industry_type: industryType,
        currency_code: currencyCode,
        phone_number: phoneNumber || null,
        plan_code: 'free',
        max_products: 100,
        max_categories: 15,
      })
      .select('*')
      .single();

    if (businessError || !business) {
      throw new Error(`فشل إنشاء بيانات المتجر: ${businessError?.message || 'خطأ في قاعدة البيانات'}`);
    }

    try {
      // 2. Link User as Owner in business_members
      const { error: memberError } = await supabase.from('business_members').insert({
        business_id: business.id,
        user_id: userId,
        role: 'owner',
      });

      if (memberError) {
        throw new Error(`فشل تعيين ملكية المتجر: ${memberError.message}`);
      }

      // 3. Auto-create 1 Default Branch (Schema-ready for future multi-branch)
      const { error: branchError } = await supabase.from('branches').insert({
        business_id: business.id,
        name: 'الفرع الرئيسي',
        is_default: true,
      });

      if (branchError) {
        throw new Error(`فشل إنشاء الفرع الافتراضي: ${branchError.message}`);
      }

      // 4. Auto-create Primary Catalog for the business
      const { error: catalogError } = await supabase.from('catalogs').insert({
        business_id: business.id,
        name: 'قائمة المتجر الرئيسية',
        slug: cleanSlug,
        is_published: true,
        theme_config: {
          preset: industryType,
        },
      });

      if (catalogError) {
        throw new Error(`فشل إنشاء القائمة الافتراضية: ${catalogError.message}`);
      }

      return business as Business;
    } catch (provisioningError) {
      // Compensating Rollback: Clean up created business and cascade records
      try {
        await supabase.from('businesses').delete().eq('id', business.id);
      } catch (rollbackError) {
        console.error('Compensating rollback failed:', rollbackError);
      }
      throw provisioningError;
    }
  }

  /**
   * Retrieves the current user's primary business
   */
  async getBusinessByUserId(userId: string): Promise<Business | null> {
    const { data: member, error } = await supabase
      .from('business_members')
      .select('business:businesses(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !member || !member.business) {
      return null;
    }

    return member.business as unknown as Business;
  }

  /**
   * Updates an existing business profile (Owner / Admin action)
   */
  async updateBusiness(businessId: string, input: UpdateBusinessInput): Promise<Business> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.phoneNumber !== undefined) updatePayload.phone_number = input.phoneNumber;
    if (input.industryType !== undefined) updatePayload.industry_type = input.industryType;
    if (input.currencyCode !== undefined) updatePayload.currency_code = input.currencyCode;
    if (input.logoUrl !== undefined) updatePayload.logo_url = input.logoUrl;
    if (input.coverUrl !== undefined) updatePayload.cover_url = input.coverUrl;

    const { data, error } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', businessId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`فشل تحديث بيانات المتجر: ${error?.message || 'خطأ غير متوقع'}`);
    }

    return data as Business;
  }
}

export const businessService = new BusinessService();
