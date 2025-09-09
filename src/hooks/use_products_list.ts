// =====================
// Hook: all products (id + name)
// =====================
import useSWR from "swr";
import { swrFetcher } from "@/lib/api-client";
import type { ProductBasic } from "@/dtos/response_dtos/product.response.dto";

export function useProductsList() {
  const { data, error, isLoading, mutate } = useSWR<ProductBasic[]>("/api/products/list", swrFetcher as any, {
    revalidateOnFocus: false,
  } as any);

  return {
    products: data ?? [],
    isLoading: Boolean(isLoading) || (!data && !error),
    isError: Boolean(error),
    error,
    mutate,
  };
}
