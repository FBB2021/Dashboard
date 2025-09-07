export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T | null;
}

export function success<T>(data: T, message = "success", code = 200): ApiResponse<T> {
  return { code, message, data };
}

export function fail(message: string, code = 400): ApiResponse<null> {
  return { code, message, data: null };
}