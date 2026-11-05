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
