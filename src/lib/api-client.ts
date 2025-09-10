// src/lib/api-client.ts
// A tiny fetch wrapper for browser & Next.js environments.
// If your API is same-origin (e.g., /api/**), you can leave NEXT_PUBLIC_API_BASE_URL empty.

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function joinURL(base: string, path: string) {
  if (!base) return path;                  // same-origin
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function api<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const url = joinURL(base, path);

  const res = await fetch(url, {
    credentials: "include",                        // send cookies (JWT in cookie)
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
    ...init,
  });

  // Try to parse JSON both on success & error
  const text = await res.text();
  const tryJson = () => {
    try { return text ? JSON.parse(text) : undefined; } catch { return undefined; }
  };
  const body = tryJson();

  if (!res.ok) {
  const msg =
    (typeof body === "object" && body !== null && "message" in body
      ? (body as { message?: string }).message
      : undefined) ||
    res.statusText ||
    "Request failed";
    throw new ApiError(msg, res.status, body);
  }

  return (body as T) ?? (undefined as T);
}

// ---- Convenience helpers ----
export const get  = <T = unknown>(path: string, init?: RequestInit) =>
  api<T>(path, { method: "GET",  ...init });

export const post = <T = unknown>(path: string, data?: unknown, init?: RequestInit) =>
  api<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined, ...init });

export const put  = <T = unknown>(path: string, data?: unknown, init?: RequestInit) =>
  api<T>(path, { method: "PUT",  body: data ? JSON.stringify(data) : undefined, ...init });

export const del  = <T = unknown>(path: string, init?: RequestInit) =>
  api<T>(path, { method: "DELETE", ...init });

// SWR/React Query friendly fetcher
export async function swrFetcher<T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }

  const json: unknown = await res.json().catch(() => null);

  // Unwrap common API envelopes: { data: ... } / { result: ... }
  if (json && typeof json === "object") {
    if ("data" in json) {
      return (json as { data: T }).data;
    }
    if ("result" in json) {
      return (json as { result: T }).result;
    }
  }
  return json as T; // fall back to raw
}
