import type { NextApiRequest, NextApiResponse } from "next";
import { withErrorHandling } from "@/common/api_handler";
import { withAuth } from "@/common/auth/withAuth";
import { withRole } from "@/common/auth/authorize";

async function handler(req: NextApiRequest & { user: any }, res: NextApiResponse) {
  // req.user is available here
  return { message: `Hello ${req.user.username}, admin area ok.` };
}

export default withErrorHandling(
  withAuth(
    withRole("ADMIN")(handler)
  )
);