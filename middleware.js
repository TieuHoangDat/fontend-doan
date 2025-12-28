// middleware.js
import { NextResponse } from 'next/server';

const publicRoutes = ['/auth/login', '/auth/register', '/auth/verify-email'];
const protectedRoutes = ['/dashboard'];

export function middleware(request) {

  return NextResponse.next();
}

export const config = {
  matcher: [],
};