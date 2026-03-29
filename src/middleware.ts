import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require the user to be logged in
const PROTECTED_ROUTES = ['/dashboard', '/transactions', '/analytics', '/profile'];

// Routes that logged-in users should NOT see (redirect to dashboard)
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there's a Firebase session cookie (set by Firebase Auth)
  // Firebase stores the auth token in localStorage (client-side only),
  // so we use a custom cookie that we can read server-side.
  // We check for the presence of the firebase auth token cookie.
  const isAuthenticated =
    request.cookies.has('__session') ||
    request.cookies.has('firebase-auth-token');

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // If trying to access a protected route without being logged in → redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/register → redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/analytics/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
