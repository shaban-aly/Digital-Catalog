import { supabase } from '../db/supabase';
import type { PublicCatalogPayload } from '../../shared/schemas';

export type TenantCatalogResult =
  | { type: 'success'; data: PublicCatalogPayload }
  | { type: 'not_found' }
  | { type: 'unpublished' }
  | { type: 'suspended' };

export class PublicCatalogService {
  /**
   * Fetches the complete public catalog payload by business slug (used for tenant subdomains)
   * with full lifecycle state checks (suspended, unpublished, not found).
   */
  async getCatalogByBusinessSlug(businessSlug: string): Promise<TenantCatalogResult> {
    const cleanSlug = businessSlug.toLowerCase().trim();

    // 1. Fetch business details
    const { data: business, error: bError } = await supabase
      .from('businesses')
      .select('id, name, slug, currency_code, phone_number, logo_url, cover_url, industry_type')
      .ilike('slug', cleanSlug)
      .maybeSingle();

    if (bError || !business) {
      return { type: 'not_found' };
    }

    if ((business as any).status === 'suspended' || (business as any).status === 'archived') {
      return { type: 'suspended' };
    }

    // 2. Fetch primary/active catalog for this business
    const { data: catalog, error: cError } = await supabase
      .from('catalogs')
      .select('id, slug, theme_config, is_published')
      .eq('business_id', business.id)
      .maybeSingle();

    if (cError || !catalog) {
      return { type: 'not_found' };
    }

    if (!catalog.is_published) {
      return { type: 'unpublished' };
    }

    // 3. Build the full catalog payload
    const payload = await this.buildPayload(business, catalog);
    return { type: 'success', data: payload };
  }

  /**
   * Fetches the complete public catalog payload in a single round-trip query
   */
  async getCatalogBySlug(catalogSlug: string): Promise<PublicCatalogPayload | null> {
    // Fetch published catalog with business details
    const { data: catalog, error: catalogError } = await supabase
      .from('catalogs')
      .select(`
        id,
        slug,
        theme_config,
        is_published,
        business:businesses (
          id,
          name,
          slug,
          currency_code,
          phone_number,
          logo_url,
          cover_url,
          industry_type
        )
      `)
      .eq('slug', catalogSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (catalogError || !catalog || !catalog.business) {
      return null;
    }

    const business = catalog.business as any;
    if (business.status && business.status !== 'active') {
      return null;
    }

    return this.buildPayload(business, catalog);
  }

  private async buildPayload(business: any, catalog: any): Promise<PublicCatalogPayload> {
    // Fetch active categories for this business
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, sort_order')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Fetch products placed in this catalog with variants, options, and media
    const { data: catalogItems } = await supabase
      .from('catalog_items')
      .select(`
        id,
        price_override,
        sort_order,
        is_featured,
        is_available,
        category_id,
        product:products (
          id,
          name,
          description,
          base_price,
          compare_at_price,
          unit,
          status,
          attributes,
          variants:product_variants (*),
          option_groups:product_option_groups (
            id,
            name,
            is_required,
            min_selections,
            max_selections,
            sort_order,
            values:product_option_values (*)
          ),
          media:product_media (*)
        )
      `)
      .eq('catalog_id', catalog.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true });

    const formattedProducts = (catalogItems || [])
      .filter((item) => item.product && (item.product as any).status === 'active')
      .map((item) => {
        const p = item.product as any;
        const effectivePrice = item.price_override !== null && item.price_override !== undefined
          ? Number(item.price_override)
          : Number(p.base_price || 0);

        const mediaList = (p.media || []) as Array<{ public_url: string; is_cover: boolean; sort_order: number }>;
        mediaList.sort((a, b) => a.sort_order - b.sort_order);

        const coverImage = mediaList.find((m) => m.is_cover)?.public_url || mediaList[0]?.public_url || null;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          effective_price: effectivePrice,
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          unit: p.unit || null,
          is_available: item.is_available,
          is_featured: item.is_featured,
          cover_image_url: coverImage,
          gallery_image_urls: mediaList.map((m) => m.public_url),
          category_id: item.category_id,
          attributes: p.attributes || {},
          variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            price: Number(v.price),
            compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined,
            is_available: v.is_available,
            attributes: v.attributes || {},
            sort_order: v.sort_order,
          })),
          option_groups: (p.option_groups || []).map((og: any) => ({
            id: og.id,
            name: og.name,
            is_required: og.is_required,
            min_selections: og.min_selections,
            max_selections: og.max_selections,
            sort_order: og.sort_order,
            values: (og.values || []).map((val: any) => ({
              id: val.id,
              name: val.name,
              price_delta: Number(val.price_delta || 0),
              is_default: val.is_default,
              sort_order: val.sort_order,
            })),
          })),
        };
      });

    // Compute category product counts
    const categoryCounts: Record<string, number> = {};
    formattedProducts.forEach((p) => {
      categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1;
    });

    const formattedCategories = (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      sort_order: c.sort_order,
      product_count: categoryCounts[c.id] || 0,
    }));

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        currency_code: business.currency_code,
        phone_number: business.phone_number,
        logo_url: business.logo_url,
        cover_url: business.cover_url,
        industry_type: business.industry_type,
      },
      catalog: {
        id: catalog.id,
        slug: catalog.slug,
        theme_config: catalog.theme_config || {},
      },
      categories: formattedCategories,
      products: formattedProducts,
    };
  }
}

export const publicCatalogService = new PublicCatalogService();
