import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { getProductHistory } from "@/services/product.service";

/**
 * Handles requests for /api/products/[id]
 * - GET: Fetch product history (inventory, procurement, sales)
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AppError("Invalid product id", 400);
  }

  if (req.method === "GET") {
    return await getProductHistory(id);
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(handler);
