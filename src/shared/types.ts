export type IndustryType = 'restaurant' | 'grocery' | 'fashion' | 'services';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type ProductStatus = 'active' | 'out_of_stock' | 'archived';

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry_type: IndustryType;
  currency_code: string;
  phone_number: string | null;
  logo_url: string | null;
  cover_url: string | null;
  plan_code: string;
  max_products: number;
  max_categories: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  is_default: boolean;
  address: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: { ar: string; en?: string };
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string;
  name: { ar: string; en?: string };
  description?: { ar: string; en?: string } | null;
  base_price?: number | null;
  compare_at_price?: number | null;
  barcode?: string | null;
  sku?: string | null;
  unit?: string | null;
  status: ProductStatus;
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  file_size_bytes: number;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface Catalog {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  is_published: boolean;
  theme_config: Record<string, any>;
  created_at: string;
}

export interface QRCode {
  id: string;
  business_id: string;
  catalog_id: string;
  short_code: string;
  is_active: boolean;
  total_scans: number;
  created_at: string;
}
