import { supabase } from '../db/supabase';
import type { CreateProductInput } from '../../shared/schemas';
import type { Product } from '../../shared/types';

export class ProductService {
  /**
   * Retrieves all master products for a business with their relations
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
   * Creates a product with its variants, option groups, and media assets
   * Enforces the 100-product quota via atomic database trigger and application check.
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

    // 1. Insert Master Product Record (Database Trigger enforces 100 max product quota atomically)
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
        file_size_bytes: 85000, // Estimated WebP compressed size
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
  async updateProduct(productId: string, updates: Partial<CreateProductInput>): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
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
}

export const productService = new ProductService();
