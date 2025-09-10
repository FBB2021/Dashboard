// =====================
// Excel → CreateProductDto[] parser
// =====================

import * as XLSX from "xlsx";
import type { CreateProductDto } from "@/dtos/request_dtos/product.dto";

/** Normalize number from mixed inputs like "$12.32", " 1,234 ", 12.32, "" */
function toNumber(v: unknown, def = 0): number {
  if (v == null) return def;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (!s) return def;
  // remove currency symbols and thousands separators
  const cleaned = s.replace(/[$,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : def;
}

/** Normalize string id (avoid dropping leading zeros) */
function toStringId(v: unknown): string {
  if (v == null) return "";
  // SheetJS often gives string already; if number, keep as raw string (no scientific)
  return String(v).trim();
}

type HeaderMap = {
  id: number;
  name: number;
  opening: number;
  // dynamic day columns
  procQty: Record<number, number>;   // day -> col index
  procPrice: Record<number, number>; // day -> col index
  saleQty: Record<number, number>;
  salePrice: Record<number, number>;
};

/** Build column mapping from header row */
function buildHeaderMap(header: string[]): HeaderMap {
  const map: HeaderMap = {
    id: -1,
    name: -1,
    opening: -1,
    procQty: {},
    procPrice: {},
    saleQty: {},
    salePrice: {},
  };

  header.forEach((raw, col) => {
    const h = (raw || "").toString().trim();

    // Basic columns
    if (/^id$/i.test(h)) map.id = col;
    else if (/^product\s*name$/i.test(h)) map.name = col;
    else if (/^opening\s*inventory$/i.test(h)) map.opening = col;

    // Pattern: "Procurement Qty (Day 1)" / "Procurement Price (Day 2)"
    let m = h.match(/^procurement\s*qty\s*\(day\s*(\d+)\)$/i);
    if (m) { map.procQty[Number(m[1])] = col; return; }
    m = h.match(/^procurement\s*price\s*\(day\s*(\d+)\)$/i);
    if (m) { map.procPrice[Number(m[1])] = col; return; }

    // Pattern: "Sales Qty (Day 1)" / "Sales Price (Day 2)"
    m = h.match(/^sales\s*qty\s*\(day\s*(\d+)\)$/i);
    if (m) { map.saleQty[Number(m[1])] = col; return; }
    m = h.match(/^sales\s*price\s*\(day\s*(\d+)\)$/i);
    if (m) { map.salePrice[Number(m[1])] = col; return; }
  });

  return map;
}

/**
 * Parse an Excel workbook buffer into CreateProductDto[].
 * - Not tied to any specific day count; auto-detects all "(Day N)" columns.
 * - Skips rows with missing id or name.
 * - For each day, pushes a record only if qty > 0 (price allowed to be 0).
 */
export function parseProductsExcel(buf: Buffer): CreateProductDto[] {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];

  // header:1 returns 2D array of raw values (strings preferred)
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
  if (!rows.length) return [];

  const header = rows[0].map((h) => (h == null ? "" : String(h)));
  const map = buildHeaderMap(header);

  const products: CreateProductDto[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    // Basic fields
    const id = toStringId(r[map.id]);
    const name = String(r[map.name] ?? "").trim();
    const openingInventory = toNumber(r[map.opening], 0);

    // Skip empty lines
    if (!id || !name) continue;

    // Gather dynamic days (union of keys from all maps)
    const daySet = new Set<number>([
      ...Object.keys(map.procQty).map(Number),
      ...Object.keys(map.procPrice).map(Number),
      ...Object.keys(map.saleQty).map(Number),
      ...Object.keys(map.salePrice).map(Number),
    ]);

    const procurements: CreateProductDto["procurements"] = [];
    const sales: CreateProductDto["sales"] = [];

    for (const d of [...daySet].sort((a, b) => a - b)) {
      const pQty = toNumber(r[map.procQty[d]], 0);
      const pPrice = toNumber(r[map.procPrice[d]], 0);
      if (pQty > 0 || pPrice > 0) procurements.push({ day: d, qty: pQty, price: pPrice });

      const sQty = toNumber(r[map.saleQty[d]], 0);
      const sPrice = toNumber(r[map.salePrice[d]], 0);
      if (sQty > 0 || sPrice > 0) sales.push({ day: d, qty: sQty, price: sPrice });
    }

    products.push({ id, name, openingInventory, procurements, sales });
  }

  return products;
}
