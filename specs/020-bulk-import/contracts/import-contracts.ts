import { z } from 'zod';

export const ImportProductRowSchema = z.object({
  categoryNameAr: z
    .string('اسم التصنيف بالعربية مطلوب')
    .min(2, 'اسم التصنيف يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم التصنيف يجب ألا يتجاوز 100 حرف'),
  categoryNameEn: z.string().max(100).optional(),
  nameAr: z
    .string('اسم المنتج بالعربية مطلوب')
    .min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل')
    .max(150, 'اسم المنتج يجب ألا يتجاوز 150 حرف'),
  nameEn: z.string().max(150).optional(),
  descriptionAr: z.string().max(1000).optional(),
  price: z.number().nonnegative('السعر يجب أن يكون 0 أو أكبر'),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url('رابط الصورة غير صالح').optional().or(z.literal('')),
});
export type ImportProductRow = z.infer<typeof ImportProductRowSchema>;

export const ImportCatalogBatchSchema = z.object({
  businessId: z.string('معرف المتجر مطلوب').uuid('معرف المتجر يجب أن يكون UUID صالح'),
  rows: z
    .array(ImportProductRowSchema)
    .min(1, 'يجب تزويد صف واحد على الأقل للاستيراد')
    .max(500, 'الحد الأقصى للاستيراد في العملية الواحدة هو 500 منتج'),
});
export type ImportCatalogBatchInput = z.infer<typeof ImportCatalogBatchSchema>;

export const ParseCsvInputSchema = z.object({
  csvContent: z.string('محتوى الملف مطلوب').min(5, 'محتوى الملف قصير جداً'),
});
export type ParseCsvInput = z.infer<typeof ParseCsvInputSchema>;
