import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const labSession = request.cookies.get("lab_session");

    // 1. PARTICIPANT LAB PROTOCOL
    if (pathname.startsWith("/lab")) {
      const isLoginRoute = pathname === "/lab/login";

      // If trying to access the Lab without a PIN session, boot to Identity Gate
      if (!isLoginRoute && !labSession) {
        return NextResponse.redirect(new URL("/lab/login", request.url));
      }

      // If already authenticated in the Lab, push them to the Lobby.
      // (The Lobby's internal timer will handle pushing them to the Terminal when it's time).
      if (isLoginRoute && labSession) {
        return NextResponse.redirect(new URL("/lab/lobby", request.url));
      }
      
      return NextResponse.next();
    }

    // 2. DASHBOARD SECURITY PROTOCOL
    // Handled by the NextAuth callback below, so we just let the request pass through here.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Is it an Organizer dashboard route?
        const isDashboard = path.startsWith("/dashboard");
        
        // If it's the dashboard, require Organizer Token. Otherwise, let it pass.
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
  // Tell the middleware to intercept traffic to both the Dashboard and the Lab
  matcher: ["/dashboard/:path*", "/lab/:path*"],
};  