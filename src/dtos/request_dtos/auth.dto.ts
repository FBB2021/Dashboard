export interface LoginRequestDto {
  /**
   * Can be username or email
   */
  identifier: string;
  password: string;
}