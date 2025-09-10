// =====================
// POST /api/products/import/commit
// - JSON body: CreateProductDto[]
// - Upserts and returns summary {imported, updated, failed, errors}
// =====================

import type { NextApiRequest } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { importProducts } from "@/services/product_import.service";
import type { CreateProductDto } from "@/dtos/request_dtos/product.dto";

async function handler(req: NextApiRequest) {
  if (req.method !== "POST") throw new AppError("Method not allowed", 405);

  const body = req.body as unknown;
  if (!Array.isArray(body)) {
    throw new AppError("Body must be an array of products.", 400);
  }

  // Minimal shape check to give friendly error
  const items = body as CreateProductDto[];
  if (items.some((p) => !p || typeof p !== "object")) {
    throw new AppError("Invalid payload.", 400);
  }

  const summary = await importProducts(items);
  return summary;
}

export default withErrorHandling(handler);
