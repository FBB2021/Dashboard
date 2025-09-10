// src/pages/api/admin/dashboard.ts
// GET /api/admin/dashboard
// Query:
//   products=0000001,0000002   (optional; absent => ALL products)
//   range=week|month|year|custom (currently only passed through for the UI; series基于day整数)
//   from=1&to=30               (optional day bounds; inclusive)
//   lowStock=10                (optional; default 10)
//   top=5&topBy=amount|qty     (optional; defaults: 5, amount)

import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { AppError } from "@/common/exceptions";
import {
  getDashboardKpis,
  getDashboardSeries,
  getTopSellingProducts,
  type TopSeller,
} from "@/services/dashboard.service";

/** Keep in sync with the hook */
type DayPoint = {
  day: string;
  inventory: number;
  procurementAmount: number;
  salesAmount: number;
};

type Kpi = {
  inventory: number;          // last point
  procurementTotal: number;   // period sum
  salesTotal: number;         // period sum
  activeUsers: number;        // sample KPI, derive from sales
  productCount: number;       // counts from service
  lowStockCount: number;
  outOfStockCount: number;
};

type DashboardResponse = {
  series: DayPoint[];
  kpis: Kpi;
  topSelling: TopSeller[];
};

function parseProductsParam(q?: string): string[] | undefined {
  if (!q) return undefined;
  const arr = q
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse | { message: string }>
) {
  if (req.method !== "GET") throw new AppError("Method Not Allowed", 405);

  const q = req.query as Record<string, string | undefined>;

  const productIds = parseProductsParam(q.products); // undefined => all products
  const range = (q.range as "week" | "month" | "year" | "custom") || "week"; // reserved for UI
  const from = q.from;
  const to = q.to;

  const lowStock = q.lowStock ? Number(q.lowStock) : 10;
  const top = q.top ? Number(q.top) : 5;
  const topBy = q.topBy === "qty" ? "qty" : "amount";

  // 1) Series from DB
  const series = await getDashboardSeries({ productIds, from, to });

  // 2) Derive period KPIs from series (single source of truth)
  const procurementTotal = series.reduce((s, r) => s + r.procurementAmount, 0);
  const salesTotal = series.reduce((s, r) => s + r.salesAmount, 0);
  const inventory = series.at(-1)?.inventory ?? 0;
  const activeUsers = Math.max(1000, Math.round((salesTotal / 100) * 1.2)); // replace with real metric if needed

  // 3) Counts: product / low-stock / out-of-stock
  const counts = await getDashboardKpis({ productIds, lowStock, range, from, to });

  // 4) Top sellers over the same window
  const topSelling = await getTopSellingProducts({ productIds, from, to }, topBy, top);

  const kpis: Kpi = {
    inventory,
    procurementTotal,
    salesTotal,
    activeUsers,
    productCount: counts.productCount,
    lowStockCount: counts.lowStockCount,
    outOfStockCount: counts.outOfStockCount,
  };

  return res.status(200).json({ series, kpis, topSelling });
}

export default withErrorHandling(handler);
