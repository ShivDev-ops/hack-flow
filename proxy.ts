// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // The route NextAuth forces users to if they fail the check
  },
});

export const config = {
  // The matcher strictly defines which routes invoke this middleware.
  // This protects /dashboard and absolutely everything nested inside it.
  matcher: ["/dashboard/:path*"],
};