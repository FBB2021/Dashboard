// src/hooks/useDashboardData.ts
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
};

export type DashboardResponse = {
  series: DayPoint[];
  kpis?: Kpi;
};

export type RangeKey = "week" | "month" | "year" | "custom";

export interface UseDashboardParams {
  products: string[];
  range?: RangeKey;
  from?: string;
  to?: string;
}

function toQuery(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") usp.set(k, v);
  });
  return usp.toString();
}

export function useDashboardData({ products, range = "week", from, to }: UseDashboardParams) {
  const hasProducts = products && products.length > 0;

  const qs = toQuery({
    products: hasProducts ? products.join(",") : undefined,
    range,
    from,
    to,
  });

  const key = hasProducts ? `/api/admin/dashboard?${qs}` : null;

  // v1/v2 兼容：不直接解构 isLoading（v1 没有）
  const swr = useSWR<DashboardResponse>(key, swrFetcher as any, {
    revalidateOnFocus: false,
  } as any);

  const { data, error, mutate } = swr;

  // 在 v2 有 isLoading；v1 用 !data && !error 推断
  const isLoading: boolean =
    typeof (swr as any).isLoading === "boolean"
      ? (swr as any).isLoading
      : !data && !error;

  return {
    series: data?.series ?? [],
    kpis: data?.kpis,
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
