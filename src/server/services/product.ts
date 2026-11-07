import { supabase } from '../db/supabase.ts';
import type { CreateProductInput, UpdateProductInput } from '../../shared/schemas.ts';
import type { Product } from '../../shared/types.ts';

export class ProductService {
  /**
   * Retrieves all non-archived products for a business with their relations
   */
  async getProducts(businessId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        variants:product_variants(*),
        option_groups:product_option_groups(
          *,
          values:product_option_values(*)
        ),
        media:product_media(*)
      `)
      .eq('business_id', businessId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return (data || []) as Product[];
  }

  /**
   * Retrieves a single product with full relational hierarchy
   */
  async getProductById(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        variants:product_variants(*),
        option_groups:product_option_groups(
          *,
          values:product_option_values(*)
        ),
        media:product_media(*)
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Product;
  }

  /**
   * Creates a product with its variants, option groups, and media assets.
   * Enforces the 100-product quota on the Free tier.
   */
  async createProduct(businessId: string, input: CreateProductInput): Promise<Product> {
    const {
      category_id,
      name,
      description,
      base_price,
      compare_at_price,
      barcode,
      sku,
      unit,
      status,
      attributes,
      variants,
      option_groups,
      image_urls,
    } = input;

    // 0. Quota Check (Max 100 products on Free Plan)
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .neq('status', 'archived');

    if (countError) {
      throw new Error(`Failed to check product count: ${countError.message}`);
    }

    if ((count ?? 0) >= 100) {
      throw new Error('تم الوصول للحد الأقصى للمنتجات في باقة الانطلاق الأساسية (100 منتج).');
    }

    // 1. Insert Master Product Record
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        business_id: businessId,
        category_id,
        name,
        description: description || null,
        base_price: base_price !== undefined ? base_price : null,
        compare_at_price: compare_at_price || null,
        barcode: barcode || null,
        sku: sku || null,
        unit: unit || 'piece',
        status: status || 'active',
        attributes: attributes || {},
      })
      .select('*')
      .single();

    if (productError || !product) {
      throw new Error(`Failed to create product: ${productError?.message || 'Database error'}`);
    }

    // 2. Insert Variants if present
    if (variants && variants.length > 0) {
      const variantInserts = variants.map((v, index) => ({
        product_id: product.id,
        name: v.name,
        sku: v.sku || null,
        barcode: v.barcode || null,
        price: v.price,
        compare_at_price: v.compare_at_price || null,
        is_available: v.is_available !== false,
        attributes: v.attributes || {},
        sort_order: v.sort_order ?? index,
      }));

      const { error: variantError } = await supabase.from('product_variants').insert(variantInserts);
      if (variantError) {
        console.error('Failed to insert variants:', variantError);
      }
    }

    // 3. Insert Option Groups and their values
    if (option_groups && option_groups.length > 0) {
      for (let i = 0; i < option_groups.length; i++) {
        const group = option_groups[i];
        const { data: groupRecord, error: groupError } = await supabase
          .from('product_option_groups')
          .insert({
            product_id: product.id,
            name: group.name,
            is_required: group.is_required || false,
            min_selections: group.min_selections || 0,
            max_selections: group.max_selections || 1,
            sort_order: group.sort_order ?? i,
          })
          .select('id')
          .single();

        if (!groupError && groupRecord && group.values.length > 0) {
          const valueInserts = group.values.map((val, valIndex) => ({
            group_id: groupRecord.id,
            name: val.name,
            price_delta: val.price_delta || 0.0,
            is_default: val.is_default || false,
            sort_order: val.sort_order ?? valIndex,
          }));

          await supabase.from('product_option_values').insert(valueInserts);
        }
      }
    }

    // 4. Insert Media Assets (Max 3 images per product)
    if (image_urls && image_urls.length > 0) {
      const mediaInserts = image_urls.slice(0, 3).map((url, imgIndex) => ({
        product_id: product.id,
        storage_path: url,
        public_url: url,
        file_size_bytes: 85000,
        is_cover: imgIndex === 0,
        sort_order: imgIndex,
      }));

      await supabase.from('product_media').insert(mediaInserts);
    }

    // 5. Automatically place product in the business's active catalog
    const { data: catalog } = await supabase
      .from('catalogs')
      .select('id')
      .eq('business_id', businessId)
      .limit(1)
      .maybeSingle();

    if (catalog) {
      await supabase.from('catalog_items').insert({
        catalog_id: catalog.id,
        product_id: product.id,
        category_id: product.category_id,
        is_available: true,
        sort_order: 0,
      });
    }

    return product as Product;
  }

  /**
   * Updates an existing product
   */
  async updateProduct(productId: string, updates: UpdateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update product: ${error?.message || 'Database error'}`);
    }

    return data as Product;
  }

  /**
   * Toggles product availability
   */
  async setAvailability(productId: string, isAvailable: boolean): Promise<void> {
    const status = isAvailable ? 'active' : 'out_of_stock';
    const { error } = await supabase
      .from('products')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) {
      throw new Error(`Failed to update product availability: ${error.message}`);
    }

    // Also update catalog item flag
    await supabase.from('catalog_items').update({ is_available: isAvailable }).eq('product_id', productId);
  }

  /**
   * Deletes a product, cascading to child variants and option groups
   */
  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Deterministically calculates customer price based on base, variant, option deltas, and catalog override
   */
  calculateLineItemPrice(params: {
    basePrice?: number | null;
    variantPrice?: number | null;
    optionDeltas?: number[];
    catalogOverride?: number | null;
  }): number {
    const { basePrice, variantPrice, optionDeltas = [], catalogOverride } = params;

    let itemBase = 0;
    if (catalogOverride !== undefined && catalogOverride !== null) {
      itemBase = catalogOverride;
    } else if (variantPrice !== undefined && variantPrice !== null) {
      itemBase = variantPrice;
    } else if (basePrice !== undefined && basePrice !== null) {
      itemBase = basePrice;
    }

    const optionsSum = optionDeltas.reduce((sum, delta) => sum + (delta || 0), 0);
    return Math.round((itemBase + optionsSum + Number.EPSILON) * 100) / 100;
  }

  /**
   * Validates customer selections against option group min/max constraints
   */
  validateOptionGroupSelections(
    group: { min_selections: number; max_selections: number; is_required: boolean },
    selectedCount: number
  ): { valid: boolean; error?: string } {
    if (group.is_required && selectedCount < Math.max(1, group.min_selections)) {
      return { valid: false, error: 'يرجى اختيار الخيارات المطلوبة' };
    }
    if (selectedCount < group.min_selections) {
      return { valid: false, error: `يجب اختيار ${group.min_selections} خيارات على الأقل` };
    }
    if (selectedCount > group.max_selections) {
      return { valid: false, error: `الحد الأقصى للاختيارات هو ${group.max_selections}` };
    }
    return { valid: true };
  }
}

export const productService = new ProductService();
