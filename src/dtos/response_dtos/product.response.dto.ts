// =====================
// Product Response DTOs
// =====================

/** Minimal product info (for dropdown/search) */
export interface ProductBasic {
  id: string;
  name: string;
}

/**
 * Represents the daily history record for a product.
 * Includes inventory level, procurement amount, and sales amount.
 */
export interface ProductHistoryRecord {
  day: number;
  inventory: number;
  procurementAmount: number;
  salesAmount: number;
}

/**
 * Represents a single product with its full history.
 */
export interface ProductHistoryResponse {
  productId: string;
  name: string;
  history: ProductHistoryRecord[];
}

/**
 * Represents multiple products history response.
 * Used for product comparison queries.
 */
export type ProductsHistoryResponse = ProductHistoryResponse[];
