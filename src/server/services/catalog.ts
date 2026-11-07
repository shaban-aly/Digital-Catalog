import { supabase } from '../db/supabase.ts';
import type { Catalog, CatalogItem } from '../../shared/types.ts';
import type { CatalogItemInput, UpdateCatalogItemInput } from '../../shared/schemas.ts';

export class CatalogService {
  /**
   * Retrieves a catalog presentation by business and slug
   */
  async getCatalogBySlug(businessId: string, slug: string): Promise<Catalog | null> {
    const { data, error } = await supabase
      .from('catalogs')
      .select('*')
      .eq('business_id', businessId)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Catalog;
  }

  /**
   * Retrieves all curated catalog items for a catalog, ordered by sort_order
   */
  async getCatalogItems(catalogId: string): Promise<CatalogItem[]> {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch catalog items: ${error.message}`);
    }

    return (data || []) as CatalogItem[];
  }

  /**
   * Places a product into a catalog category with presentation settings
   */
  async addCatalogItem(input: CatalogItemInput): Promise<CatalogItem> {
    const { data, error } = await supabase
      .from('catalog_items')
      .insert({
        catalog_id: input.catalog_id,
        product_id: input.product_id,
        category_id: input.category_id,
        price_override: input.price_override ?? null,
        sort_order: input.sort_order ?? 0,
        is_featured: input.is_featured ?? false,
        is_available: input.is_available ?? true,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to add item to catalog: ${error?.message || 'Database error'}`);
    }

    return data as CatalogItem;
  }

  /**
   * Updates an existing catalog item's presentation settings (price override, sort order, etc.)
   */
  async updateCatalogItem(catalogItemId: string, input: UpdateCatalogItemInput): Promise<CatalogItem> {
    const updatePayload: Record<string, unknown> = {};

    if (input.category_id !== undefined) updatePayload.category_id = input.category_id;
    if (input.price_override !== undefined) updatePayload.price_override = input.price_override;
    if (input.sort_order !== undefined) updatePayload.sort_order = input.sort_order;
    if (input.is_featured !== undefined) updatePayload.is_featured = input.is_featured;
    if (input.is_available !== undefined) updatePayload.is_available = input.is_available;

    const { data, error } = await supabase
      .from('catalog_items')
      .update(updatePayload)
      .eq('id', catalogItemId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update catalog item: ${error?.message || 'Database error'}`);
    }

    return data as CatalogItem;
  }

  /**
   * Removes a product placement from a catalog without deleting the master product
   */
  async removeCatalogItem(catalogItemId: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_items')
      .delete()
      .eq('id', catalogItemId);

    if (error) {
      throw new Error(`Failed to remove item from catalog: ${error.message}`);
    }
  }

  /**
   * Resolves the effective price on storefront:
   * Presentation price_override takes precedence over product base_price.
   */
  calculateEffectivePrice(
    basePrice: number | null | undefined,
    priceOverride: number | null | undefined
  ): number {
    if (priceOverride !== undefined && priceOverride !== null) {
      return priceOverride;
    }
    if (basePrice !== undefined && basePrice !== null) {
      return basePrice;
    }
    return 0;
  }
}

export const catalogService = new CatalogService();

