import { NextRequest, NextResponse } from 'next/server';

function parseJwtPayload(token: string): { userId?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Security Headers applied to all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none';");

  // Protected paths check
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isProtectedApi = pathname.startsWith('/api/admin') || pathname.startsWith('/api/import');

  if (isProtectedPage || isProtectedApi) {
    const token = req.cookies.get('society_token')?.value;

    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: 'Unauthorized. Authentication token required.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = parseJwtPayload(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: 'Session expired. Please log in again.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check for /admin and /api/admin - require 'admin' role
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (payload.role !== 'admin') {
        if (isProtectedApi) {
          return NextResponse.json(
            { error: 'Forbidden. Admin privileges required.' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/import/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
