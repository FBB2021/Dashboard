import { RoleResponse } from "./role.response.dto";
/**
 * DTO for returning user information to the client.
 * Excludes sensitive fields like password.
 */
export interface UserResponse {
  /** Unique identifier of the user */
  id: number;

  /** Username of the user */
  username: string;

  /** Email address of the user */
  email: string;

  /** Timestamp when the user account was created */
  createdAt: Date;
  
  /** Role of user */
  role: { id: number; name: string };
}

export interface UserDetailResponse extends Omit<UserResponse, "role"> {
  /**
   * Full role data with permissions when needed.
   */
  role: RoleResponse;
}