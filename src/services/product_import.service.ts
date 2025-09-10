// =====================
// Product Import Service
// =====================

import { prisma } from "@/lib/prisma";
import { parseProductsExcel } from "@/utils/excel_product_parser";
import { createProduct, updateProduct } from "@/services/product.service";
import { AppError } from "@/common/exceptions";

export interface ImportSummary {
  imported: number;
  updated: number;
  failed: number;
  errors: { id: string; message: string }[];
}

/**
 * Import products from an Excel buffer.
 * - Parse rows to CreateProductDto[]
 * - Upsert each product (create if not exists, otherwise update)
 * - Return a summary
 */
export async function importProductsFromExcel(buf: Buffer): Promise<ImportSummary> {
  const items = parseProductsExcel(buf);
  if (!items.length) throw new AppError("No valid rows found in Excel.", 400);

  const summary: ImportSummary = { imported: 0, updated: 0, failed: 0, errors: [] };

  for (const p of items) {
    try {
      const exists = await prisma.product.findUnique({ where: { id: p.id } });
      if (!exists) {
        await createProduct(p);
        summary.imported++;
      } else {
        await updateProduct(p.id, {
          name: p.name,
          openingInventory: p.openingInventory,
          procurements: p.procurements,
          sales: p.sales,
        });
        summary.updated++;
      }
    } catch (e: any) {
      summary.failed++;
      summary.errors.push({ id: p.id, message: e?.message || "Unknown error" });
    }
  }

  return summary;
}
