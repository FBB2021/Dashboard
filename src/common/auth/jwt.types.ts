import type { NextApiRequest, NextApiResponse } from "next";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export type AuthedRequest = NextApiRequest & { user: JwtPayload };
export type AuthedHandler = (req: AuthedRequest, res: NextApiResponse) => any;
