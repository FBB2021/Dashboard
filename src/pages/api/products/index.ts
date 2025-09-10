import type { NextApiRequest } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import {
  getProductsHistory,
  createProduct,
} from "@/services/product.service";
import { CreateProductDto } from "@/dtos/request_dtos/product.dto";

/**
 * Handles requests for /api/products
 * - GET: Fetch history for multiple products (ids query param)
 * - POST: Create a new product
 */
async function handler(req: NextApiRequest) {
  if (req.method === "GET") {
    const { ids } = req.query;
    if (!ids || typeof ids !== "string") {
      throw new AppError("Query param 'ids' is required", 400);
    }
    const productIds = ids.split(",").map((id) => id.trim());
    return await getProductsHistory(productIds);
  }

  if (req.method === "POST") {
    const body: CreateProductDto = req.body;
    return await createProduct(body);
  }

  throw new AppError("Method not allowed", 405);
}

export default withErrorHandling(handler);
