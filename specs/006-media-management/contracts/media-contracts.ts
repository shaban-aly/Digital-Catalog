/**
 * Interface Contracts: Product Media Management (MED-001)
 */

export interface ProductMediaEntity {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  file_size_bytes: number;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

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

export interface IMediaService {
  /**
   * Retrieves all media assets for a product ordered by sort_order
   */
  getProductMedia(productId: string): Promise<ProductMediaEntity[]>;

  /**
   * Uploads and registers a compressed product image enforcing the 3-image quota
   */
  uploadProductImage(params: {
    businessId: string;
    productId: string;
    file: Blob | File;
    filename: string;
  }): Promise<ProductMediaEntity>;

  /**
   * Designates an image as the product's primary cover image
   */
  setCoverImage(productId: string, mediaId: string): Promise<void>;

  /**
   * Batch updates visual sort order of images in gallery
   */
  reorderMedia(productId: string, items: { id: string; sort_order: number }[]): Promise<void>;

  /**
   * Deletes a media record and removes object from storage bucket
   */
  deleteProductImage(mediaId: string): Promise<void>;
}

