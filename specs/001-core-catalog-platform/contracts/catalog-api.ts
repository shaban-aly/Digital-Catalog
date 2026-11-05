import { z } from 'zod';

/**
 * Localized Bilingual String Schema
 */
export const LocalizedStringSchema = z.object({
  ar: z.string().min(1, 'Arabic text is required'),
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

export const ProductOptionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  is_required: z.boolean().default(false),
  min_selections: z.number().int().nonnegative().default(0),
  max_selections: z.number().int().positive().default(1),
  sort_order: z.number().int().default(0),
  values: z.array(ProductOptionValueSchema).min(1, 'Option group must have at least one choice'),
});

/**
 * Product Variant Schema (e.g. Size x Color)
 */
export const ProductVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: LocalizedStringSchema,
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive('Variant price must be greater than zero'),
  compare_at_price: z.number().positive().optional(),
  is_available: z.boolean().default(true),
  attributes: z.record(z.string()).default({}), // e.g. { size: 'XL', color: 'Black' }
  sort_order: z.number().int().default(0),
});

/**
 * Product Creation & Update DTO Schema
 */
export const CreateProductInputSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  base_price: z.number().nonnegative('Price cannot be negative').optional(),
  compare_at_price: z.number().positive().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().default('piece'),
  status: z.enum(['active', 'out_of_stock', 'archived']).default('active'),
  attributes: z.record(z.any()).default({}),
  variants: z.array(ProductVariantSchema).max(10, 'Max 10 variants allowed').default([]),
  option_groups: z.array(ProductOptionGroupSchema).default([]),
  image_urls: z.array(z.string().url()).max(3, 'Max 3 images per product').default([]),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

/**
 * Public Catalog Hydration Response Schema
 */
export const PublicCatalogProductSchema = z.object({
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
  attributes: z.record(z.any()),
  variants: z.array(ProductVariantSchema),
  option_groups: z.array(ProductOptionGroupSchema),
});

export const PublicCatalogCategorySchema = z.object({
  id: z.string().uuid(),
  name: LocalizedStringSchema,
  sort_order: z.number(),
  product_count: z.number(),
});

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
    theme_config: z.record(z.any()),
  }),
  categories: z.array(PublicCatalogCategorySchema),
  products: z.array(PublicCatalogProductSchema),
});
export type PublicCatalogPayload = z.infer<typeof PublicCatalogPayloadSchema>;

/**
 * Dynamic QR Code Redirection Schema
 */
export const QRResolveResponseSchema = z.object({
  destination_url: z.string().url(),
  is_active: z.boolean(),
});
export type QRResolveResponse = z.infer<typeof QRResolveResponseSchema>;

