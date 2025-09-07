export interface PermissionResponse {
  id: number;
  name: string;
  description?: string | null;
}

export interface RoleResponse {
  id: number;
  name: string;
  /**
   * Optional to avoid heavy joins on simple endpoints.
   * When needed (e.g., login), include permission names or objects.
   */
  permissions?: string[] | PermissionResponse[];
}