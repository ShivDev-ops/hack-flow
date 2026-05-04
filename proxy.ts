import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server"; //
import type { NextRequest } from "next/server"; //

export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const labSession = request.cookies.get("lab_session");

    // 1. LAB SECURITY PROTOCOL
    if (pathname.startsWith("/lab")) {
      const isLoginRoute = pathname === "/lab/login";

      // If trying to access the Lab without a PIN session, boot to Identity Gate
      if (!isLoginRoute && !labSession) {
        return NextResponse.redirect(new URL("/lab/login", request.url));
      }

      // If already authenticated in the Lab, don't show the login gate again
      if (isLoginRoute && labSession) {
        return NextResponse.redirect(new URL("/lab/terminal", request.url));
      }
      
      return NextResponse.next();
    }

    // 2. DASHBOARD SECURITY PROTOCOL
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
        if (isDashboard) return !!token; 
        return true; 
      },
    },
    pages: {
      signIn: "/login", 
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/lab/:path*"],
};