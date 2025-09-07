export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export function success<T>(data: T, message = "success", code = 200): ApiResponse<T> {
  return { code, message, data };
}

export function error(message: string, code = 500): ApiResponse<null> {
  return { code, message, data: null };
}
