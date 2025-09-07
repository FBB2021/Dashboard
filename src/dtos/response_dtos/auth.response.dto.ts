import { UserDetailResponse } from "./user.response.dto";

export interface LoginResponseDto {
  token: string;
  /**
   * Include role & (optionally) permissions so the frontend can route by role
   * and do client-side feature gating right after login.
   */
  user: UserDetailResponse;
}