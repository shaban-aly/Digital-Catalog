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
      'https://catalog.daleel-al-suez.com';
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
   * Generates a public URL for the storage asset.
   * In development or unless a valid production custom domain is configured,
   * returns the direct Supabase Storage public URL to guarantee 100% reliable image loading.
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(path);

    // Only rewrite if customDomainBase is set, is NOT localhost, and is NOT a template placeholder
    if (
      this.customDomainBase &&
      !this.customDomainBase.includes('localhost') &&
      !this.customDomainBase.includes('127.0.0.1') &&
      !this.customDomainBase.includes('<my-name>') &&
      !data.publicUrl.startsWith(this.customDomainBase)
    ) {
      const cleanBase = this.customDomainBase.replace(/\/+$/, '');
      const urlObj = new URL(data.publicUrl);
      return `${cleanBase}${urlObj.pathname}`;
    }

    return data.publicUrl;
  }
}

export const storageService = new SupabaseStorageProvider();
