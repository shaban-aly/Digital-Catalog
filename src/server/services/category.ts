import { supabase } from '../db/supabase';
import type { Category } from '../../shared/types';
import type { CategoryInput } from '../../shared/schemas';

export class CategoryService {
  /**
   * Retrieves all categories for a business
   */
  async getCategories(businessId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (data || []) as Category[];
  }

  /**
   * Creates a new category enforcing the max 15 categories quota
   */
  async createCategory(businessId: string, input: CategoryInput): Promise<Category> {
    // 1. Quota Check
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    if (countError) {
      throw new Error(`Failed to check category count: ${countError.message}`);
    }

    if ((count || 0) >= 15) {
      throw new Error('تم الوصول للحد الأقصى للتصنيفات في الخطة المجانية (15 تصنيفاً).');
    }

    // 2. Insert Category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        business_id: businessId,
        name: input.name,
        sort_order: input.sort_order,
        is_active: input.is_active,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create category: ${error?.message || 'Database error'}`);
    }

    return data as Category;
  }

  /**
   * Updates an existing category
   */
  async updateCategory(categoryId: string, input: Partial<CategoryInput>): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update({
        ...input,
      })
      .eq('id', categoryId);

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  /**
   * Deletes a category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }
}

export const categoryService = new CategoryService();
