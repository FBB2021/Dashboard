import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import { getAllProducts } from "@/services/product.service";

/**
 * Handles requests for /api/products/list
 * - GET: Return all products with id and name
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return await getAllProducts();
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(handler);
