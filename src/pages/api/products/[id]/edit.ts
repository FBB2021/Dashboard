import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { getProductEditData } from "@/services/product.service";

/**
 * Handles GET /api/products/[id]/edit
 * - Returns name, openingInventory, and raw lines (procurements & sales)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) throw new AppError("Invalid product id", 400);

  if (req.method === "GET") {
    return await getProductEditData(id);
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(handler);
