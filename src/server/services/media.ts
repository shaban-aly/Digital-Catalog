import { supabase } from '../db/supabase.ts';
import { storageService } from './storage.ts';
import type { ProductMedia } from '../../shared/types.ts';
import type { UpdateMediaSortInput } from '../../shared/schemas.ts';

export class MediaService {
  /**
   * Generates a standardized bucket storage path
   */
  buildStoragePath(businessId: string, productId: string, filename: string): string {
    const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    const safeWebpName = cleanFilename.endsWith('.webp') ? cleanFilename : `${cleanFilename}.webp`;
    return `${businessId}/${productId}/${Date.now()}-${safeWebpName}`;
  }

  /**
   * Retrieves all media assets for a product ordered by sort_order
   */
  async getProductMedia(productId: string): Promise<ProductMedia[]> {
    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch product media: ${error.message}`);
    }

    return (data || []) as ProductMedia[];
  }

  /**
   * Uploads and registers a compressed product image enforcing the 3-image Free quota limit
   */
  async uploadProductImage(params: {
    businessId: string;
    productId: string;
    file: Blob | File | ArrayBuffer;
    filename: string;
  }): Promise<ProductMedia> {
    const { businessId, productId, file, filename } = params;

    // 1. Quota Check (Max 3 images per product on Free Plan)
    const { count, error: countError } = await supabase
      .from('product_media')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (countError) {
      throw new Error(`Failed to check media count: ${countError.message}`);
    }

    if ((count ?? 0) >= 3) {
      throw new Error('الحد الأقصى هو 3 صور لكل منتج في الباقة الحالية.');
    }

    const isFirstImage = (count ?? 0) === 0;
    const storagePath = this.buildStoragePath(businessId, productId, filename);

    // 2. Upload asset to Supabase Storage bucket
    const uploadResult = await storageService.upload(file, storagePath, {
      contentType: 'image/webp',
    });

    // 3. Register record in public.product_media
    const { data: mediaRecord, error: insertError } = await supabase
      .from('product_media')
      .insert({
        product_id: productId,
        storage_path: uploadResult.path,
        public_url: uploadResult.publicUrl,
        file_size_bytes: uploadResult.sizeBytes,
        is_cover: isFirstImage,
        sort_order: count ?? 0,
      })
      .select('*')
      .single();

    if (insertError || !mediaRecord) {
      // Compensating rollback: remove uploaded object if database record fails
      try {
        await storageService.delete(uploadResult.path);
      } catch {
        // Rollback attempt
      }
      throw new Error(`Failed to register product media: ${insertError?.message || 'Database error'}`);
    }

    return mediaRecord as ProductMedia;
  }

  /**
   * Designates an image as the product's primary cover image
   */
  async setCoverImage(productId: string, mediaId: string): Promise<void> {
    // 1. Demote all existing images of this product
    const { error: demoteError } = await supabase
      .from('product_media')
      .update({ is_cover: false })
      .eq('product_id', productId);

    if (demoteError) {
      throw new Error(`Failed to update cover status: ${demoteError.message}`);
    }

    // 2. Promote the target image as cover
    const { error: promoteError } = await supabase
      .from('product_media')
      .update({ is_cover: true })
      .eq('id', mediaId);

    if (promoteError) {
      throw new Error(`Failed to set cover image: ${promoteError.message}`);
    }
  }

  /**
   * Batch updates sort orders for gallery display
   */
  async reorderMedia(_productId: string, items: UpdateMediaSortInput): Promise<void> {
    for (const item of items) {
      const { error } = await supabase
        .from('product_media')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) {
        throw new Error(`Failed to update media sort order: ${error.message}`);
      }
    }
  }

  /**
   * Deletes a product image and cleans up storage asset with cover promotion fallback
   */
  async deleteProductImage(mediaId: string): Promise<void> {
    // 1. Fetch media record to retrieve storage path and cover status
    const { data: media, error: fetchError } = await supabase
      .from('product_media')
      .select('*')
      .eq('id', mediaId)
      .maybeSingle();

    if (fetchError || !media) {
      throw new Error(`Product media not found: ${fetchError?.message || 'Invalid ID'}`);
    }

    const wasCover = media.is_cover;
    const productId = media.product_id;

    // 2. Delete database record
    const { error: deleteError } = await supabase
      .from('product_media')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      throw new Error(`Failed to delete media record: ${deleteError.message}`);
    }

    // 3. Delete physical object from storage bucket
    try {
      await storageService.delete(media.storage_path);
    } catch (storageErr) {
      console.warn('Storage deletion warning:', storageErr);
    }

    // 4. If deleted image was cover, promote the next available image
    if (wasCover) {
      const { data: remaining } = await supabase
        .from('product_media')
        .select('id')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (remaining) {
        await supabase
          .from('product_media')
          .update({ is_cover: true })
          .eq('id', remaining.id);
      }
    }
  }
}

export const mediaService = new MediaService();

