import { supabase } from '../db/supabase.ts';
import type { Category } from '../../shared/types.ts';
import type { CategoryInput, UpdateCategoryInput, BatchReorderCategoriesInput } from '../../shared/schemas.ts';

export class CategoryService {
  /**
   * Retrieves all categories for a business ordered by sort_order ascending
   */
  async getCategories(businessId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (data || []) as Category[];
  }

  /**
   * Creates a new category enforcing the max 15 categories Free plan quota
   */
  async createCategory(businessId: string, input: CategoryInput): Promise<Category> {
    // 1. Quota Check (Max 15 on Free Plan)
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (countError) {
      throw new Error(`Failed to check category count: ${countError.message}`);
    }

    if ((count ?? 0) >= 15) {
      throw new Error('تم الوصول للحد الأقصى للتصنيفات في باقة الانطلاق الأساسية (15 تصنيفاً).');
    }

    // 2. Insert Category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        business_id: businessId,
        name: input.name,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create category: ${error?.message || 'Database error'}`);
    }

    return data as Category;
  }

  /**
   * Updates an existing category (bilingual name, sort order, or visibility)
   */
  async updateCategory(categoryId: string, input: UpdateCategoryInput): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...input,
      })
      .eq('id', categoryId)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update category: ${error?.message || 'Database error'}`);
    }

    return data as Category;
  }

  /**
   * Deletes a category. Database foreign key RESTRICT will protect against deleting categories with products.
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Batch updates sort orders for multiple categories in a single routine
   */
  async reorderCategories(_businessId: string, items: BatchReorderCategoriesInput): Promise<void> {
    for (const item of items) {
      const { error } = await supabase
        .from('categories')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id);

      if (error) {
        throw new Error(`Failed to update category sort order: ${error.message}`);
      }
    }
  }
}

export const categoryService = new CategoryService();
