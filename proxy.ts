// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * In-memory rate limiting for API routes.
 * Limits each IP to 100 requests per minute.
 */
function rateLimit(req: NextRequest): NextResponse | undefined {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(globalThis as any).__globalRateStore) {
    (globalThis as any).__globalRateStore = new Map();
  }
  const store = (globalThis as any).__globalRateStore as Map<string, { count: number; reset: number }>;
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 100;
  const entry = store.get(ip) || { count: 0, reset: now + windowMs };

  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  store.set(ip, entry);

  if (entry.count > limit) {
    const res = new NextResponse('Too Many Requests', { status: 429 });
    res.headers.set('Retry-After', `${Math.ceil((entry.reset - now) / 1000)}`);
    return res;
  }
  return undefined;
}

/**
 * Apply security-related HTTP headers to responses.
 */
function setSecurityHeaders(res: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jmmzgwgmokpdfoobunrq.supabase.co';
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://media.giphy.com https://media0.giphy.com https://media1.giphy.com https://media2.giphy.com https://media3.giphy.com https://media4.giphy.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace('https://', 'wss://')} https://api.giphy.com https://api.github.com https://sheets.googleapis.com https://generativelanguage.googleapis.com`,
    "frame-src 'self' https: http:",
    "child-src 'self' https: http:",
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. API Rate Limiting
  if (pathname.startsWith('/api')) {
    if (!pathname.startsWith('/api/lab/login')) {
      const limited = rateLimit(request);
      if (limited) {
        setSecurityHeaders(limited);
        return limited;
      }
    }
  }

  // 2. Dashboard Route Protection (NextAuth JWT session)
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const res = NextResponse.redirect(loginUrl);
      setSecurityHeaders(res);
      return res;
    }
  }

  // 3. Participant Lab Protocol
  if (pathname.startsWith('/lab')) {
    const isLoginRoute = pathname === '/lab/login';
    const labSession = request.cookies.get('lab_session')?.value;

    // Boot unauthenticated users attempting to access lab inner routes
    if (!isLoginRoute && !labSession) {
      const res = NextResponse.redirect(new URL('/lab/login', request.url));
      setSecurityHeaders(res);
      return res;
    }

    // If already authenticated and visiting login, send to lobby
    if (isLoginRoute && labSession) {
      const res = NextResponse.redirect(new URL('/lab/lobby', request.url));
      setSecurityHeaders(res);
      return res;
    }
  }

  const response = NextResponse.next();
  setSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and image optimization
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};