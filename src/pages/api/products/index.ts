import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { getProductsHistory } from "@/services/product.service";

/**
 * Handles requests for /api/products
 * - GET /api/products?ids=0000001,0000002
 *   Returns inventory, procurement, and sales history for multiple products
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ids } = req.query;

  if (!ids || typeof ids !== "string") {
    throw new AppError("Query param 'ids' is required", 400);
  }

  if (req.method === "GET") {
    const productIds = ids.split(",").map((id) => id.trim());
    return await getProductsHistory(productIds);
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(handler);
