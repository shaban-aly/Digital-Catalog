import { supabase } from '../db/supabase';

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
}

export interface IStorageProvider {
  upload(
    file: Blob | File | ArrayBuffer,
    path: string,
    options: { contentType: string }
  ): Promise<StorageUploadResult>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

const BUCKET_NAME = 'product-images';
const MAX_UPLOAD_SIZE_BYTES = 200 * 1024; // 200 KB max limit
const ALLOWED_MIME_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

/**
 * Supabase Storage Provider with Cloudflare CDN Rewriting
 */
export class SupabaseStorageProvider implements IStorageProvider {
  private bucket: string;
  private customDomainBase: string;

  constructor(bucket = BUCKET_NAME) {
    this.bucket = bucket;
    this.customDomainBase =
      import.meta.env.VITE_PUBLIC_APP_URL ||
      process.env.VITE_PUBLIC_APP_URL ||
      'https://<my-name>.daleel-al-suez.com';
  }

  async upload(
    file: Blob | File | ArrayBuffer,
    path: string,
    options: { contentType: string }
  ): Promise<StorageUploadResult> {
    const { contentType } = options;

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new Error(`Unsupported media type: ${contentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    const byteLength = file instanceof ArrayBuffer ? file.byteLength : file.size;
    if (byteLength > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(
        `File size (${Math.round(byteLength / 1024)}KB) exceeds the 200KB limit. Ensure images are compressed to WebP.`
      );
    }

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error || !data) {
      throw new Error(`Storage upload failed: ${error?.message || 'Unknown error'}`);
    }

    const publicUrl = this.getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl,
      sizeBytes: byteLength,
      mimeType: contentType,
    };
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabase.storage.from(this.bucket).remove([path]);
    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  }

  /**
   * Generates a CDN-cached public URL fronted by Cloudflare
   * Protects Supabase Free Tier 2GB Egress by caching images at Cloudflare Edge for 30 days.
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(path);

    // If a custom domain base is configured, rewrite to proxy through Cloudflare CDN
    if (this.customDomainBase && !data.publicUrl.startsWith(this.customDomainBase)) {
      const urlObj = new URL(data.publicUrl);
      return `${this.customDomainBase}${urlObj.pathname}`;
    }

    return data.publicUrl;
  }
}

export const storageService = new SupabaseStorageProvider();
