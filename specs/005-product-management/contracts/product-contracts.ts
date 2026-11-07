import type { CreateProductInput, UpdateProductInput } from '../../../src/shared/schemas.ts';

/**
 * Interface Contracts: Product, Variant, and Modifier Management (PRD-001)
 */

export type ProductStatus = 'active' | 'out_of_stock' | 'archived';

export interface ProductVariantEntity {
  id: string;
  product_id: string;
  name: { ar: string; en?: string };
  sku?: string | null;
  barcode?: string | null;
  price: number;
  compare_at_price?: number | null;
  is_available: boolean;
  attributes: Record<string, string>;
  sort_order: number;
}

export interface ProductOptionValueEntity {
  id: string;
  group_id: string;
  name: { ar: string; en?: string };
  price_delta: number;
  is_default: boolean;
  sort_order: number;
}

export interface ProductOptionGroupEntity {
  id: string;
  product_id: string;
  name: { ar: string; en?: string };
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  sort_order: number;
  values: ProductOptionValueEntity[];
}

export interface ProductEntity {
  id: string;
  business_id: string;
  category_id: string;
  name: { ar: string; en?: string };
  description?: { ar?: string; en?: string } | null;
  base_price?: number | null;
  compare_at_price?: number | null;
  barcode?: string | null;
  sku?: string | null;
  unit: string;
  status: ProductStatus;
  attributes: Record<string, unknown>;
  variants?: ProductVariantEntity[];
  option_groups?: ProductOptionGroupEntity[];
  created_at: string;
  updated_at: string;
}

export type { CreateProductInput, UpdateProductInput };

export interface IProductService {
  /**
   * Retrieves all non-archived products for a business with their variants and option groups
   */
  getProducts(businessId: string): Promise<ProductEntity[]>;

  /**
   * Retrieves a single product with full relational hierarchy
   */
  getProductById(productId: string): Promise<ProductEntity | null>;

  /**
   * Creates a product, enforcing the 100-product quota on the Free tier
   */
  createProduct(businessId: string, input: CreateProductInput): Promise<ProductEntity>;

  /**
   * Updates an existing master product
   */
  updateProduct(productId: string, updates: UpdateProductInput): Promise<ProductEntity>;

  /**
   * Toggles product availability ('active' <-> 'out_of_stock')
   */
  setAvailability(productId: string, isAvailable: boolean): Promise<void>;

  /**
   * Deletes a product, cascading to variants, option groups, and catalog items
   */
  deleteProduct(productId: string): Promise<void>;

  /**
   * Deterministically calculates customer price based on base, variant, option deltas, and catalog override
   */
  calculateLineItemPrice(params: {
    basePrice?: number | null;
    variantPrice?: number | null;
    optionDeltas?: number[];
    catalogOverride?: number | null;
  }): number;
}
