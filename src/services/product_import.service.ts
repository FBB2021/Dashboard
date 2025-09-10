// =====================
// Product Import Service
// =====================

import { prisma } from "@/lib/prisma";
import { AppError } from "@/common/exceptions";
import { parseProductsExcel } from "@/utils/excel_product_parser";
import { createProduct, updateProduct } from "@/services/product.service";
import type { CreateProductDto } from "@/dtos/request_dtos/product.dto";

export interface ImportSummary {
  imported: number;
  updated: number;
  failed: number;
  errors: { id: string; message: string }[];
}

/** Parse an Excel file buffer to CreateProductDto[] (no DB writes). */
export function parseExcelBuffer(buf: Buffer): CreateProductDto[] {
  const rows = parseProductsExcel(buf);
  if (!rows.length) throw new AppError("No valid rows found in Excel.", 400);
  return rows;
}

/**
 * Upsert a list of products.
 * - Creates when not exists, otherwise updates (including daily rows).
 * - Returns a summary for UI.
 */
export async function importProducts(items: CreateProductDto[]): Promise<ImportSummary> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Empty payload.", 400);
  }

  const summary: ImportSummary = { imported: 0, updated: 0, failed: 0, errors: [] };

  for (const p of items) {
    try {
      if (!p.id || !p.name) throw new AppError(`Invalid product row.`, 400);

      // Normalize numbers defensively
      p.openingInventory = Number(p.openingInventory ?? 0);
      p.procurements = (p.procurements ?? []).map((d) => ({
        day: Number(d.day) || 0,
        qty: Number(d.qty) || 0,
        price: Number(d.price) || 0,
      }));
      p.sales = (p.sales ?? []).map((d) => ({
        day: Number(d.day) || 0,
        qty: Number(d.qty) || 0,
        price: Number(d.price) || 0,
      }));

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
    } catch (e: unknown) {
      summary.failed++;
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
          ? e
          : "Unknown error";
      summary.errors.push({ id: p.id ?? "UNKNOWN", message });
    }
  }

  return summary;
}
