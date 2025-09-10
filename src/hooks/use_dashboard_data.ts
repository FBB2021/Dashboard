import useSWR from "swr";
import { swrFetcher } from "@/lib/api-client";

/** A single day point in the time series */
export type DayPoint = {
  day: string;
  inventory: number;
  procurementAmount: number;
  salesAmount: number;
};

/** Dashboard KPI metrics */
export type Kpi = {
  inventory: number;          // inventory on the last day
  procurementTotal: number;   // total procurement amount in range
  salesTotal: number;         // total sales amount in range
  activeUsers: number;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

/** Top-selling product */
export type TopSeller = {
  id: string;
  name: string;
  qty: number;
  amount: number;
};

/** Response structure returned by the dashboard API */
export type DashboardResponse = {
  series: DayPoint[];
  kpis?: Kpi;
  topSelling?: TopSeller[];
};

/** Supported range keys */
export type RangeKey = "week" | "month" | "year" | "custom";

/** Range parameters accepted by the API */
export interface ApiRangeParams {
  range?: RangeKey;
  from?: string; // ISO string (used when range = "custom")
  to?: string;   // ISO string (used when range = "custom")
}

/** Hook params for fetching dashboard data */
export interface UseDashboardParams extends ApiRangeParams {
  products: string[];                 // empty = all products
  lowStock?: number | string;
  top?: number | string;
  topBy?: "amount" | "qty";
}

/** Helper: build query string from params */
function toQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") usp.set(k, v);
  });
  return usp.toString();
}

/**
 * Custom hook for fetching dashboard data.
 * Wraps SWR with a typed fetcher and query string builder.
 */
export function useDashboardData({
  products,
  range = "week",
  from,
  to,
  lowStock,
  top,
  topBy,
}: UseDashboardParams) {
  // If products is empty, omit the parameter → backend will aggregate all
  const qs = toQuery({
    products: products?.length ? products.join(",") : undefined,
    range,
    from,
    to,
    lowStock: lowStock?.toString(),
    top: top?.toString(),
    topBy,
  });

  // Always send a request (even with no products selected)
  const key = `/api/admin/dashboard?${qs}`;

  // Use SWR with a strongly typed fetcher
  const { data, error, mutate, isLoading } = useSWR<DashboardResponse>(
    key,
    swrFetcher<DashboardResponse>,
    { revalidateOnFocus: false }
  );

  return {
    series: data?.series ?? [],
    kpis: data?.kpis,
    topSelling: data?.topSelling ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
