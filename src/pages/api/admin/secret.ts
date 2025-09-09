import type { NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { withAuth } from "@/common/auth/withAuth";
import { withRole } from "@/common/auth/authorize";
import type { AuthedRequest, AuthedHandler } from "@/common/auth/jwt.types";

const handler: AuthedHandler = async (req: AuthedRequest, res: NextApiResponse) => {
  return { message: `Hello ${req.user?.username}, admin area ok.` };
};

export default withErrorHandling(
  withAuth(withRole("ADMIN")(handler))
);
