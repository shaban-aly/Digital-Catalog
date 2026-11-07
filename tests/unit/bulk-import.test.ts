import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BulkImportService } from '../../src/server/services/bulk-import.ts';
import {
  ImportProductRowSchema,
  ImportCatalogBatchSchema,
} from '../../src/shared/schemas.ts';

describe('Bulk Catalog & Menu Import (IMP-001)', () => {
  const validBusinessId = '123e4567-e89b-12d3-a456-426614174000';
  const service = new BulkImportService();

  describe('Zero-Dependency Native CSV Parser', () => {
    it('parses standard English header CSV accurately', () => {
      const csv = `category_name_ar,name_ar,price,description_ar
برجر,برجر دبل بيكون,120,لحم بقري مشوي
مشروبات,عصير مانجو فريش,35,طازج طبيعي
`;

      const rows = service.parseCsvString(csv);
      assert.equal(rows.length, 2);
      assert.equal(rows[0].categoryNameAr, 'برجر');
      assert.equal(rows[0].nameAr, 'برجر دبل بيكون');
      assert.equal(rows[0].price, 120);
      assert.equal(rows[0].descriptionAr, 'لحم بقري مشوي');

      assert.equal(rows[1].categoryNameAr, 'مشروبات');
      assert.equal(rows[1].nameAr, 'عصير مانجو فريش');
      assert.equal(rows[1].price, 35);
    });

    it('parses Arabic header CSV (التصنيف، اسم_المنتج، السعر)', () => {
      const csv = `التصنيف,اسم_المنتج,السعر,الوصف
مشويات,كباب وكفتة ميكس,250,أشهى المشويات بالسويس
مقبلات,سلطة طحينة,20,طحينة سمسم بلدي
`;

      const rows = service.parseCsvString(csv);
      assert.equal(rows.length, 2);
      assert.equal(rows[0].categoryNameAr, 'مشويات');
      assert.equal(rows[0].nameAr, 'كباب وكفتة ميكس');
      assert.equal(rows[0].price, 250);
      assert.equal(rows[1].categoryNameAr, 'مقبلات');
    });

    it('handles quoted strings with internal commas safely', () => {
      const csv = `category_name_ar,name_ar,price,description_ar
وجبات,"وجبة التوفير العائلية, حجم عائلي",180,"تشمل 4 برجر, بطاطس, ولتر كولا"
`;

      const rows = service.parseCsvString(csv);
      assert.equal(rows.length, 1);
      assert.equal(rows[0].nameAr, 'وجبة التوفير العائلية, حجم عائلي');
      assert.equal(rows[0].descriptionAr, 'تشمل 4 برجر, بطاطس, ولتر كولا');
      assert.equal(rows[0].price, 180);
    });

    it('handles empty and malformed CSV input gracefully', () => {
      assert.deepEqual(service.parseCsvString(''), []);
      assert.deepEqual(service.parseCsvString('single_header_row_only\n'), []);
    });
  });

  describe('ImportProductRowSchema Validation', () => {
    it('accepts valid Arabic product row', () => {
      const row = {
        categoryNameAr: 'سندوتشات',
        nameAr: 'شاورما دجاج سوري',
        price: 65,
        descriptionAr: 'شاورما على السيخ مع صوص ثومية وخيار مخلل',
        isAvailable: true,
      };

      const parsed = ImportProductRowSchema.parse(row);
      assert.equal(parsed.categoryNameAr, 'سندوتشات');
      assert.equal(parsed.nameAr, 'شاورما دجاج سوري');
      assert.equal(parsed.price, 65);
    });

    it('rejects row when Arabic category name is missing or too short', () => {
      assert.throws(
        () => {
          ImportProductRowSchema.parse({
            categoryNameAr: 'أ',
            nameAr: 'شاورما',
            price: 50,
          });
        },
        {
          message: /حرفين على الأقل/,
        }
      );
    });

    it('rejects row when Arabic product name is missing or too short', () => {
      assert.throws(
        () => {
          ImportProductRowSchema.parse({
            categoryNameAr: 'سندوتشات',
            nameAr: 'س',
            price: 50,
          });
        },
        {
          message: /حرفين على الأقل/,
        }
      );
    });

    it('rejects negative price', () => {
      assert.throws(
        () => {
          ImportProductRowSchema.parse({
            categoryNameAr: 'سندوتشات',
            nameAr: 'شاورما لحم',
            price: -10,
          });
        },
        {
          message: /السعر يجب أن يكون 0 أو أكبر/,
        }
      );
    });
  });

  describe('ImportCatalogBatchSchema Validation', () => {
    it('accepts valid batch with non-empty rows', () => {
      const batch = {
        businessId: validBusinessId,
        rows: [
          {
            categoryNameAr: 'حلويات',
            nameAr: 'أم علي بالمكسرات',
            price: 40,
          },
        ],
      };

      const parsed = ImportCatalogBatchSchema.parse(batch);
      assert.equal(parsed.rows.length, 1);
    });

    it('rejects batch with empty rows array', () => {
      assert.throws(
        () => {
          ImportCatalogBatchSchema.parse({
            businessId: validBusinessId,
            rows: [],
          });
        },
        {
          message: /يجب تزويد صف واحد على الأقل/,
        }
      );
    });

    it('rejects batch exceeding 500 items', () => {
      const hugeRows = Array.from({ length: 501 }, () => ({
        categoryNameAr: 'وجبات',
        nameAr: 'برجر دجاج',
        price: 50,
      }));

      assert.throws(
        () => {
          ImportCatalogBatchSchema.parse({
            businessId: validBusinessId,
            rows: hugeRows,
          });
        },
        {
          message: /الحد الأقصى للاستيراد في العملية الواحدة هو 500/,
        }
      );
    });
  });

  describe('BulkImportService Preview & Quota Enforcement', () => {
    it('previewImport returns row validation and category summaries', async () => {
      const rows = [
        {
          categoryNameAr: 'مشروبات',
          nameAr: 'قهوة تركي مظبوط',
          price: 25,
        },
        {
          categoryNameAr: 'مشروبات',
          nameAr: 'شاي كشري',
          price: 15,
        },
        {
          categoryNameAr: 'حلويات',
          nameAr: 'تشيز كيك توت',
          price: 55,
        },
      ];

      const preview = await service.previewImport(validBusinessId, rows);
      assert.equal(preview.totalRows, 3);
      assert.equal(preview.validRowCount, 3);
      assert.equal(preview.invalidRowCount, 0);
      assert.equal(preview.canProceed, true);
      assert.equal(preview.categoriesToCreate.length, 2);
      assert.ok(preview.categoriesToCreate.includes('مشروبات'));
      assert.ok(preview.categoriesToCreate.includes('حلويات'));
    });

    it('previewImport flags invalid rows with line numbers and messages', async () => {
      const rows = [
        {
          categoryNameAr: 'سندوتشات',
          nameAr: 'برجر لحم',
          price: 80,
        },
        {
          categoryNameAr: 'سندوتشات',
          nameAr: '', // Invalid empty name
          price: 80,
        },
        {
          categoryNameAr: 'سندوتشات',
          nameAr: 'هوت دوج',
          price: -20, // Invalid negative price
        },
      ];

      const preview = await service.previewImport(validBusinessId, rows);
      assert.equal(preview.totalRows, 3);
      assert.equal(preview.validRowCount, 1);
      assert.equal(preview.invalidRowCount, 2);
      assert.equal(preview.canProceed, false);
      assert.equal(preview.errors.length, 2);
      assert.equal(preview.errors[0].rowNumber, 2);
      assert.equal(preview.errors[1].rowNumber, 3);
    });
  });

  describe('BulkImportService Execution & Role-Based Authorization', () => {
    it('allows editor, admin, and owner roles to import catalog', () => {
      assert.equal(service.canImport('editor'), true);
      assert.equal(service.canImport('admin'), true);
      assert.equal(service.canImport('owner'), true);
    });

    it('denies viewer role from importing catalog with Arabic 403 Forbidden', () => {
      assert.equal(service.canImport('viewer'), false);

      assert.throws(
        () => {
          service.assertCanImport('viewer');
        },
        {
          name: 'Error',
          message: /غير مصرح لك باستيراد المنتجات/,
        }
      );
    });

    it('importBatch executes successfully and returns creation statistics', async () => {
      const rows = [
        {
          categoryNameAr: 'ساندوتشات بحرية',
          nameAr: 'جمبري مقلي سويسي',
          price: 95,
          descriptionAr: 'جمبري طازج من حلقة سمك السويس مع طحينة وسلطة خضراء',
        },
        {
          categoryNameAr: 'ساندوتشات بحرية',
          nameAr: 'سبيط مقلي',
          price: 85,
        },
      ];

      const result = await service.importBatch(validBusinessId, rows, 'admin');
      assert.equal(typeof result.categoriesCreated, 'number');
      assert.equal(typeof result.productsCreated, 'number');
      assert.ok(result.productsCreated >= 2);
      assert.ok(result.durationMs >= 0);
    });
  });
});
