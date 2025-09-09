// =====================
// Product Request DTOs
// =====================

/** Procurement entry for creation */
export interface CreateProcurementDto {
  day: number;
  qty: number;
  price: number;
}

/** Sale entry for creation */
export interface CreateSaleDto {
  day: number;
  qty: number;
  price: number;
}

/** Create a new product with optional procurement and sales history */
export interface CreateProductDto {
  id: string;
  name: string;
  openingInventory: number;
  procurements?: CreateProcurementDto[];
  sales?: CreateSaleDto[];
}

/** Update procurement entry */
export interface UpdateProcurementDto {
  day: number;
  qty: number;
  price: number;
}

/** Update sale entry */
export interface UpdateSaleDto {
  day: number;
  qty: number;
  price: number;
}

/** Update product info (with optional history updates) */
export interface UpdateProductDto {
  name?: string;
  openingInventory?: number;
  procurements?: UpdateProcurementDto[];
  sales?: UpdateSaleDto[];
}