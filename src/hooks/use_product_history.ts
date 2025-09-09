// =====================
// Hook: single product history
// =====================
import useSWR from "swr";
import { swrFetcher } from "@/lib/api-client";
import type { ProductHistoryResponse } from "@/dtos/response_dtos/product.response.dto";

export function useProductHistory(id: string) {
  const key = id ? `/api/products/${id}` : null;
  const { data, error, isLoading, mutate } = useSWR<ProductHistoryResponse>(key, swrFetcher as any, {
    revalidateOnFocus: false,
  } as any);

  return {
    data,
    isLoading: Boolean(isLoading) || (!data && !error),
    isError: Boolean(error),
    error,
    mutate,
  };
}
