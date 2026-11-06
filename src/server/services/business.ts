import { supabase } from '../db/supabase';
import type { Business } from '../../shared/types';

export interface CreateBusinessInput {
  name: string;
  slug: string;
  industryType?: 'restaurant' | 'grocery' | 'fashion' | 'services';
  currencyCode?: string;
  phoneNumber?: string;
}

export class BusinessService {
  /**
   * Checks whether a slug is available for a new merchant subdomain
   */
  async checkSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
    const cleanSlug = slug.toLowerCase().trim();

    // 1. Client-side DNS RFC 1123 format check
    if (cleanSlug.length < 3) {
      return { available: false, reason: 'الرابط قصير جداً (3 أحرف على الأقل)' };
    }
    if (cleanSlug.length > 63) {
      return { available: false, reason: 'الرابط طويل جداً (63 حرف كحد أقصى)' };
    }
    if (!/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(cleanSlug) || cleanSlug.includes('--')) {
      return { available: false, reason: 'الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة واحدة فقط، وبدون شرطات في البداية أو النهاية' };
    }

    // 2. Query DB RPC or check tables directly
    try {
      const { data: isAvailable, error } = await supabase.rpc('is_slug_available', { p_slug: cleanSlug });
      if (!error && typeof isAvailable === 'boolean') {
        return {
          available: isAvailable,
          reason: isAvailable ? undefined : 'هذا الرابط محجوز أو مستخدم بالفعل',
        };
      }
    } catch {
      // Fallback to table queries if RPC is not yet applied
    }

    // Fallback: check businesses table
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .ilike('slug', cleanSlug)
      .maybeSingle();

    if (existing) {
      return { available: false, reason: 'هذا الرابط مسجل لمتجر آخر' };
    }

    return { available: true };
  }

  /**
   * Initializes a new business profile and its default branch for an authenticated merchant
   */
  async createBusiness(userId: string, input: CreateBusinessInput): Promise<Business> {
    const { name, slug, industryType = 'restaurant', currencyCode = 'EGP', phoneNumber } = input;

    // Clean slug
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\u0621-\u064A-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 0. Try Atomic RPC procedure first
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

    // 1. Direct Table Inserts Fallback
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
      throw new Error(`Failed to create business: ${businessError?.message || 'Database error'}`);
    }

    // 2. Link User as Owner in business_members
    const { error: memberError } = await supabase.from('business_members').insert({
      business_id: business.id,
      user_id: userId,
      role: 'owner',
    });

    if (memberError) {
      // Rollback business if member link fails
      await supabase.from('businesses').delete().eq('id', business.id);
      throw new Error(`Failed to assign business ownership: ${memberError.message}`);
    }

    // 3. Auto-create 1 Default Branch (Schema-ready for future multi-branch)
    await supabase.from('branches').insert({
      business_id: business.id,
      name: 'الفرع الرئيسي',
      is_default: true,
    });

    // 4. Auto-create Primary Catalog for the business
    await supabase.from('catalogs').insert({
      business_id: business.id,
      name: 'قائمة المتجر الرئيسية',
      slug: cleanSlug,
      is_published: true,
      theme_config: {
        preset: industryType,
      },
    });

    return business as Business;
  }

  /**
   * Retrieves the current user's primary business
   */
  async getBusinessByUserId(userId: string): Promise<Business | null> {
    const { data: member } = await supabase
      .from('business_members')
      .select('business:businesses(*)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!member || !member.business) {
      return null;
    }

    return member.business as unknown as Business;
  }
}

export const businessService = new BusinessService();
