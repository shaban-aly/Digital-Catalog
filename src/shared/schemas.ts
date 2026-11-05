import { z } from 'zod';

/**
 * Localized Bilingual String Schema (Arabic mandatory, English optional)
 */
export const LocalizedStringSchema = z.object({
  ar: z.string().min(1, 'النص العربي مطلوب'),
  en: z.string().optional(),
});
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

/**
 * Industry Preset Attributes Schemas
 */
export const RestaurantAttributesSchema = z.object({
  calories: z.number().int().nonnegative().optional(),
  allergens: z.array(z.string()).default([]),
  dietary_tags: z.array(z.string()).default([]), // vegan, vegetarian, gluten-free, halal
  preparation_time_minutes: z.number().int().positive().optional(),
});

export const GroceryAttributesSchema = z.object({
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.enum(['piece', 'kg', 'g', 'pack', 'liter', 'ml']).default('piece'),
  package_weight: z.number().positive().optional(),
  origin_country: z.string().optional(),
});

export const FashionAttributesSchema = z.object({
  material: z.string().optional(),
  care_instructions: z.string().optional(),
  size_chart_url: z.string().url().optional(),
  gender: z.enum(['men', 'women', 'kids', 'unisex']).optional(),
});

/**
 * Product Option Modifier Schemas
 */
export const ProductOptionValueSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  price_delta: z.number().nonnegative().default(0),
  is_default: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});
export type ProductOptionValue = z.infer<typeof ProductOptionValueSchema>;

export const ProductOptionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  is_required: z.boolean().default(false),
  min_selections: z.number().int().nonnegative().default(0),
  max_selections: z.number().int().positive().default(1),
  sort_order: z.number().int().default(0),
  values: z.array(ProductOptionValueSchema).min(1, 'مجموعة الخيارات يجب أن تحتوي على خيار واحد على الأقل'),
});
export type ProductOptionGroup = z.infer<typeof ProductOptionGroupSchema>;

/**
 * Product Variant Schema (e.g. Size x Color)
 */
export const ProductVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive('سعر المتغير يجب أن يكون أكبر من صفر'),
  compare_at_price: z.number().positive().optional(),
  is_available: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).default({}), // e.g. { size: 'XL', color: 'Blue' }
  sort_order: z.number().int().default(0),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

/**
 * Product Creation & Update DTO Schema
 */
export const CreateProductInputSchema = z.object({
  category_id: z.string().uuid('معرف التصنيف غير صالح'),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  base_price: z.number().nonnegative('لا يمكن أن يكون السعر سالباً').optional(),
  compare_at_price: z.number().positive().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('piece'),
  status: z.enum(['active', 'out_of_stock', 'archived']).default('active'),
  attributes: z.record(z.string(), z.any()).default({}),
  variants: z.array(ProductVariantSchema).max(10, 'الحد الأقصى للمتغيرات هو 10 متغيرات').default([]),
  option_groups: z.array(ProductOptionGroupSchema).default([]),
  image_urls: z.array(z.string().url()).max(3, 'الحد الأقصى هو 3 صور لكل منتج').default([]),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

/**
 * Category Schema
 */
export const CategoryInputSchema = z.object({
  name: LocalizedStringSchema,
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof CategoryInputSchema>;

/**
 * Public Catalog Hydration Payloads
 */
export const PublicProductSchema = z.object({
  id: z.string().uuid(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.nullable(),
  effective_price: z.number(),
  compare_at_price: z.number().nullable(),
  unit: z.string().nullable(),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  cover_image_url: z.string().nullable(),
  gallery_image_urls: z.array(z.string()),
  category_id: z.string().uuid(),
  attributes: z.record(z.string(), z.any()),
  variants: z.array(ProductVariantSchema),
  option_groups: z.array(ProductOptionGroupSchema),
});
export type PublicProduct = z.infer<typeof PublicProductSchema>;

export const PublicCategorySchema = z.object({
  id: z.string().uuid(),
  name: LocalizedStringSchema,
  sort_order: z.number(),
  product_count: z.number(),
});
export type PublicCategory = z.infer<typeof PublicCategorySchema>;

export const PublicCatalogPayloadSchema = z.object({
  business: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    currency_code: z.string(),
    phone_number: z.string().nullable(),
    logo_url: z.string().nullable(),
    cover_url: z.string().nullable(),
    industry_type: z.string(),
  }),
  catalog: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    theme_config: z.record(z.string(), z.any()),
  }),
  categories: z.array(PublicCategorySchema),
  products: z.array(PublicProductSchema),
});
export type PublicCatalogPayload = z.infer<typeof PublicCatalogPayloadSchema>;
