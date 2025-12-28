// middleware.js
import { NextResponse } from 'next/server';

const publicRoutes = ['/auth/login', '/auth/register', '/auth/verify-email'];
const protectedRoutes = ['/dashboard'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] Path:', pathname);

  // ✅ Đọc token từ NHIỀU nguồn
  const cookieToken = request.cookies.get('auth_token')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  const token = cookieToken || bearerToken;

  console.log('[Middleware] Token found:', !!token, 'From:', cookieToken ? 'cookie' : bearerToken ? 'header' : 'none');

  // Skip middleware cho public routes
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Nếu đã có token và đang ở public route → redirect dashboard
  if (token && publicRoutes.some(r => pathname.startsWith(r))) {
    console.log('[Middleware] Redirect to dashboard (already logged in)');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Nếu KHÔNG có token và đang ở protected route → redirect login
  if (!token && protectedRoutes.some(r => pathname.startsWith(r))) {
    console.log('[Middleware] Redirect to login (no token)');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/((?!_next|api|favicon.ico).*)',
  ],
};