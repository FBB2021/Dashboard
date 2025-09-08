// src/pages/api/admin/dashboard.ts
import type { NextApiRequest, NextApiResponse } from "next";

/** --- Types (keep in sync with /src/hooks/useDashboardData.ts) --- */
type DayPoint = {
  day: string;                 // x 轴标签（日期/日序）
  inventory: number;
  procurementAmount: number;
  salesAmount: number;
};

type Kpi = {
  inventory: number;           // 最后一个点的库存
  procurementTotal: number;    // 期间采购额合计
  salesTotal: number;          // 期间销售额合计
  activeUsers: number;         // 示例 KPI
};

type DashboardResponse = {
  series: DayPoint[];
  kpis: Kpi;
};

/** --- Helpers: seedable pseudo-random for stable mock --- */
function hashSeed(s: string) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) / 2 ** 32;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** --- Date helpers --- */
function formatISODate(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function daysBetween(a: Date, b: Date) {
  return Math.max(1, Math.round((+b - +a) / 86400000) + 1);
}

/** Generate merged series for selected products */
function generateSeries(
  products: string[],
  range: "week" | "month" | "year" | "custom",
  from?: string,
  to?: string
): DayPoint[] {
  let totalPoints = 7;
  let labels: string[] = [];

  if (range === "week") totalPoints = 7;
  else if (range === "month") totalPoints = 30;
  else if (range === "year") totalPoints = 12;

  if (range === "custom" && from && to) {
    const start = new Date(from);
    const end = new Date(to);
    totalPoints = daysBetween(start, end);
    for (let i = 0; i < totalPoints; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      labels.push(formatISODate(d));
    }
  } else if (range === "year") {
    // Month labels
    const now = new Date();
    for (let i = totalPoints - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  } else {
    // recent day labels
    const now = new Date();
    for (let i = totalPoints - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      labels.push(formatISODate(d));
    }
  }

  // Aggregate across products deterministically
  const series: DayPoint[] = labels.map((label, idx) => {
    let inventory = 0;
    let procurementAmount = 0;
    let salesAmount = 0;

    products.forEach((p) => {
      const seed = hashSeed(`${p}:${label}:${idx}`);
      const rnd = mulberry32(Math.floor(seed * 1e9));

      // 基础盘（可按实际业务换成 DB 聚合结果）
      const invBase = 3000 + Math.floor(rnd() * 5000); // 3000–8000
      const procBase = 600 + Math.floor(rnd() * 1600); // 600–2200
      const saleBase = 400 + Math.floor(rnd() * 1600); // 400–2000

      // 一点趋势/波动
      const trend = 1 + (idx / labels.length) * 0.05; // up to +5%
      inventory += Math.round(invBase * trend);
      procurementAmount += Math.round(procBase * (0.9 + rnd() * 0.25));
      salesAmount += Math.round(saleBase * (0.9 + rnd() * 0.3));
    });

    return { day: label, inventory, procurementAmount, salesAmount };
  });

  return series;
}

/** Compute KPIs from series */
function computeKpis(series: DayPoint[]): Kpi {
  const last = series[series.length - 1];
  const procurementTotal = series.reduce((s, r) => s + r.procurementAmount, 0);
  const salesTotal = series.reduce((s, r) => s + r.salesAmount, 0);
  // 示例：活跃用户可来自你真实表，这里仅构造一个随规模波动的数
  const activeUsers = Math.max(1000, Math.round((salesTotal / 100) * 1.3));
  return {
    inventory: last?.inventory ?? 0,
    procurementTotal,
    salesTotal,
    activeUsers,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardResponse | { message: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Parse query
  const productsParam = (req.query.products as string | undefined) ?? "";
  const products = productsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rangeParam = (req.query.range as string | undefined)?.toLowerCase();
  const range = (["week", "month", "year", "custom"].includes(rangeParam || "")
    ? (rangeParam as "week" | "month" | "year" | "custom")
    : "week");

  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const safeProducts = products.length ? products : ["Product A"];

  // ----- MOCK PIPELINE (replace with Prisma when ready) -----
  const series = generateSeries(safeProducts, range, from, to);

  // TODO (Prisma 示例伪代码):
  // const rows = await prisma.transaction.aggregate({
  //   where: {
  //     productName: { in: safeProducts },
  //     date: { gte: new Date(from ?? defaultFrom), lte: new Date(to ?? defaultTo) },
  //   },
  //   by: ["date"], // 或按天 TRUNC(date)
  //   _sum: { inventory: true, procurementAmount: true, salesAmount: true },
  //   orderBy: { date: "asc" },
  // });
  // const series = rows.map(r => ({
  //   day: formatISODate(r.date),
  //   inventory: r._sum.inventory ?? 0,
  //   procurementAmount: r._sum.procurementAmount ?? 0,
  //   salesAmount: r._sum.salesAmount ?? 0,
  // }));

  const kpis = computeKpis(series);

  return res.status(200).json({ series, kpis });
}
