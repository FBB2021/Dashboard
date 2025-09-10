import useSWR from "swr";
import { swrFetcher } from "@/lib/api-client";

export type DayPoint = {
  day: string;
  inventory: number;
  procurementAmount: number;
  salesAmount: number;
};

export type Kpi = {
  inventory: number;            // last day inventory
  procurementTotal: number;     // sum over period
  salesTotal: number;           // sum over period
  activeUsers: number;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type TopSeller = {
  id: string;
  name: string;
  qty: number;
  amount: number;
};

export type DashboardResponse = {
  series: DayPoint[];
  kpis?: Kpi;
  topSelling?: TopSeller[];
};

export type RangeKey = "week" | "month" | "year" | "custom";

export interface UseDashboardParams {
  products: string[];                 // empty = All products
  range?: RangeKey;
  from?: string;
  to?: string;
  lowStock?: number | string;
  top?: number | string;
  topBy?: "amount" | "qty";
}

function toQuery(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") usp.set(k, v);
  });
  return usp.toString();
}

export function useDashboardData({
  products,
  range = "week",
  from,
  to,
  lowStock,
  top,
  topBy,
}: UseDashboardParams) {
  // If empty, omit the products parameter -> Backend statistics for all
  const qs = toQuery({
    products: products?.length ? products.join(",") : undefined,
    range,
    from,
    to,
    lowStock: lowStock?.toString(),
    top: top?.toString(),
    topBy,
  });

  // Always send requests (even if no product is selected)
  const key = `/api/admin/dashboard?${qs}`;

  const swr = useSWR<DashboardResponse>(key, swrFetcher<DashboardResponse>, {
    revalidateOnFocus: false,
  });

  const { data, error, mutate, isLoading } = swr;

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
