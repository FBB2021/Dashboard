// =====================
// Hook: product edit data
// =====================
import useSWR from "swr";
import { swrFetcher } from "@/lib/api-client";
import type { ProductEditResponse } from "@/dtos/response_dtos/product.response.dto";

export function useProductEdit(id: string) {
  const key = id ? `/api/products/${id}/edit` : null;
  const { data, error, isLoading, mutate } = useSWR<any>(key, swrFetcher as any, {
    revalidateOnFocus: false,
  } as any);

  const payload: ProductEditResponse | undefined =
    data && !("data" in data) ? data : data?.data;

  return {
    data: payload,
    isLoading: Boolean(isLoading) || (!data && !error),
    isError: Boolean(error),
    error,
    mutate,
  };
}
