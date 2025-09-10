// src/services/dashboard.service.ts
// Database-backed dashboard helpers (no mock)

import { prisma } from "@/lib/prisma";

/** Public types exposed to the API layer */
export type DashboardRange = "week" | "month" | "year" | "custom";

export type DashboardSeriesPoint = {
  day: string;               // keep string for XAxis
  inventory: number;         // Σ inventory across selected products at end of day
  procurementAmount: number; // Σ(qty*price) that day
  salesAmount: number;       // Σ(qty*price) that day
};

export interface TopSeller {
  id: string;
  name: string;
  qty: number;       // total sold quantity in period
  amount: number;    // total sales amount (qty * price) in period
}

export interface DashboardCounts {
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface DashboardParams {
  productIds?: string[];         // undefined => ALL products
  range?: DashboardRange;        // reserved for future
  from?: string;                 // integer day lower bound (inclusive)
  to?: string;                   // integer day upper bound (inclusive)
  lowStock?: number;             // threshold for low stock, default 10
}

/** --- Private helpers --- */
function parseBound(v?: string): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function currentInventory(p: {
  openingInventory: number;
  procurements: { qty: number }[];
  sales: { qty: number }[];
}) {
  const proc = p.procurements.reduce((s, r) => s + r.qty, 0);
  const sold = p.sales.reduce((s, r) => s + r.qty, 0);
  return p.openingInventory + proc - sold;
}

/** 仅负责数量类 KPI：产品数 / 低库存数 / 缺货数 */
export async function getDashboardKpis(params: DashboardParams): Promise<DashboardCounts> {
  const { productIds, lowStock = 10 } = params || {};
  const whereProduct = productIds?.length ? { id: { in: productIds } } : {};

  const productCount = await prisma.product.count({ where: whereProduct });

  const products = await prisma.product.findMany({
    where: whereProduct,
    include: {
      procurements: { select: { qty: true } },
      sales: { select: { qty: true } },
    },
  });

  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const p of products) {
    const inv = currentInventory(p);
    if (inv <= 0) outOfStockCount++;
    if (inv <= lowStock) lowStockCount++;
  }

  return { productCount, lowStockCount, outOfStockCount };
}

/**
 * Top-N by revenue/quantity over an optional [from, to] day range.
 */
export async function getTopSellingProducts(
  params: { productIds?: string[]; from?: string; to?: string },
  sortBy: "amount" | "qty" = "amount",
  limit = 5
): Promise<TopSeller[]> {
  const { productIds, from, to } = params || {};
  const whereProduct = productIds?.length ? { id: { in: productIds } } : {};
  const low = parseBound(from);
  const hi = parseBound(to);

  const data = await prisma.product.findMany({
    where: whereProduct,
    select: {
      id: true,
      name: true,
      sales: { select: { qty: true, price: true, day: true } },
    },
  });

  const rows: TopSeller[] = data.map((p) => {
    const filtered = p.sales.filter(
      (s) => (low == null || s.day >= low) && (hi == null || s.day <= hi)
    );
    const qty = filtered.reduce((s, r) => s + r.qty, 0);
    const amount = filtered.reduce((s, r) => s + r.qty * Number(r.price), 0);
    return { id: p.id, name: p.name, qty, amount };
  });

  rows.sort((a, b) => (sortBy === "qty" ? b.qty - a.qty : b.amount - a.amount));
  return rows.slice(0, limit);
}

/**
 * Build dashboard series from real DB rows.
 * - Stock is rolled cumulatively per product.
 * - If a date range is provided, we fix the opening at `from` by adding all prior movements.
 */
export async function getDashboardSeries({
  productIds,
  from,
  to,
}: {
  productIds?: string[];
  from?: string;
  to?: string;
}): Promise<DashboardSeriesPoint[]> {
  const products = await prisma.product.findMany({
    where: productIds ? { id: { in: productIds } } : undefined,
    include: { procurements: true, sales: true },
  });

  if (products.length === 0) return [];

  // Collect all distinct days across selected products
  const allDayNumbers = new Set<number>();
  for (const p of products) {
    p.procurements.forEach((r) => allDayNumbers.add(r.day));
    p.sales.forEach((r) => allDayNumbers.add(r.day));
  }
  const allDays = Array.from(allDayNumbers).sort((a, b) => a - b);

  const low = parseBound(from);
  const hi = parseBound(to);

  // Visible days (the range of the returned series)
  let days = allDays;
  if (low != null) days = days.filter((d) => d >= low);
  if (hi != null) days = days.filter((d) => d <= hi);
  if (days.length === 0) return [];

  type DayAgg = { qty: number; amount: number };
  const indexByDay = <T extends { day: number; qty: number; price: number }>(rows: T[]) => {
    const m = new Map<number, DayAgg>();
    for (const r of rows) {
      const cur = m.get(r.day) ?? { qty: 0, amount: 0 };
      cur.qty += r.qty;
      cur.amount += r.qty * Number(r.price);
      m.set(r.day, cur);
    }
    return m;
  };

  type DayValue = { inventory: number; procAmount: number; saleAmount: number };
  type PerProductDay = Map<number, DayValue>;
  const perProduct: PerProductDay[] = [];

  for (const p of products) {
    const procIdx = indexByDay(p.procurements);
    const saleIdx = indexByDay(p.sales);

    // Opening inventory at `from`: openingInventory + Σ movements BEFORE low
    let inv = p.openingInventory;
    if (low != null) {
      let preProc = 0,
        preSale = 0;
      for (const d of allDays) {
        if (d >= low) break;
        preProc += procIdx.get(d)?.qty ?? 0;
        preSale += saleIdx.get(d)?.qty ?? 0;
      }
      inv += preProc - preSale;
    }


    const dayMap: PerProductDay = new Map<number, DayValue>();
    for (const d of days) {
      const proc = procIdx.get(d) ?? { qty: 0, amount: 0 };
      const sale = saleIdx.get(d) ?? { qty: 0, amount: 0 };
      inv += proc.qty - sale.qty;
      dayMap.set(d, { inventory: inv, procAmount: proc.amount, saleAmount: sale.amount });
    }
    perProduct.push(dayMap);
  }

  return days.map((d) => {
    let inventory = 0,
      procurementAmount = 0,
      salesAmount = 0;
    for (const m of perProduct) {
      const row = m.get(d);
      if (!row) continue;
      inventory += row.inventory;
      procurementAmount += row.procAmount;
      salesAmount += row.saleAmount;
    }
    return { day: String(d), inventory, procurementAmount, salesAmount };
  });
}
