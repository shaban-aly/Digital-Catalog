import type {
  CategoryInput,
  UpdateCategoryInput,
  BatchReorderCategoriesInput,
  CatalogItemInput,
  UpdateCatalogItemInput,
} from '../../../src/shared/schemas.ts';

/**
 * Interface Contracts: Catalog and Category Management (CAT-001)
 */

export interface CategoryEntity {
  id: string;
  business_id: string;
  name: { ar: string; en?: string };
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CatalogEntity {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  is_published: boolean;
  theme_config: Record<string, unknown>;
  created_at: string;
}

export interface CatalogItemEntity {
  id: string;
  catalog_id: string;
  product_id: string;
  category_id: string;
  price_override?: number | null;
  sort_order: number;
  is_featured: boolean;
  is_available: boolean;
}

export interface ICategoryService {
  /**
   * Retrieves all categories for a business ordered by sort_order
   */
  getCategories(businessId: string): Promise<CategoryEntity[]>;

  /**
   * Creates a new category enforcing the max 15 categories quota
   */
  createCategory(businessId: string, input: CategoryInput): Promise<CategoryEntity>;

  /**
   * Updates an existing category's name, sort order, or visibility
   */
  updateCategory(categoryId: string, input: UpdateCategoryInput): Promise<CategoryEntity>;

  /**
   * Deletes an empty category; rejects if products are attached
   */
  deleteCategory(categoryId: string): Promise<void>;

  /**
   * Batch updates sort order for multiple categories
   */
  reorderCategories(businessId: string, items: BatchReorderCategoriesInput): Promise<void>;
}

export interface ICatalogService {
  /**
   * Retrieves a catalog presentation by business and slug
   */
  getCatalogBySlug(businessId: string, slug: string): Promise<CatalogEntity | null>;

  /**
   * Retrieves all curated catalog items for a catalog
   */
  getCatalogItems(catalogId: string): Promise<CatalogItemEntity[]>;

  /**
   * Places a product into a catalog category
   */
  addCatalogItem(input: CatalogItemInput): Promise<CatalogItemEntity>;

  /**
   * Updates catalog item curation (price override, sort order, featured flag)
   */
  updateCatalogItem(catalogItemId: string, input: UpdateCatalogItemInput): Promise<CatalogItemEntity>;

  /**
   * Removes a product placement from a catalog without deleting the master product
   */
  removeCatalogItem(catalogItemId: string): Promise<void>;
}

