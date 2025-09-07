/**
 * DTO for creating a new user.
 * Required fields: username, email, password.
 */
export interface CreateUserDto {
  /** Unique username for the user */
  username: string;

  /** Unique email address for the user */
  email: string;

  /** Password for account authentication */
  password: string;
}

/**
 * DTO for updating an existing user.
 * All fields are optional, only the provided ones will be updated.
 */
export interface UpdateUserDto {
  /** New username for the user (optional) */
  username?: string;

  /** New email address for the user (optional) */
  email?: string;

  /** New password for the user (optional) */
  password?: string;
}