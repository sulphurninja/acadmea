import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of protected routes based on role
  const adminRoutes = ['/admin'];
  const teacherRoutes = ['/teacher'];
  const studentRoutes = ['/student'];
  const parentRoutes = ['/parent'];
  const authenticatedRoutes = ['/dashboard', ...adminRoutes, ...teacherRoutes, ...studentRoutes, ...parentRoutes];

  // Check if the route requires authentication
  const isProtectedRoute = authenticatedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get the token from the cookies
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Redirect to login if no token is present
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify and decode the token
      const decoded: any = jwtDecode(token);

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        // Token expired, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check role-based access
      const { role } = decoded;

      // Admin routes check
      if (adminRoutes.some(route => pathname.startsWith(route)) && role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Teacher routes check
      if (teacherRoutes.some(route => pathname.startsWith(route)) && role !== 'teacher') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Student routes check
      if (studentRoutes.some(route => pathname.startsWith(route)) && role !== 'student') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Parent routes check
      if (parentRoutes.some(route => pathname.startsWith(route)) && role !== 'parent') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Specify which paths this middleware should run on
  matcher: ['/dashboard/:path*', '/admin/:path*', '/teacher/:path*', '/student/:path*', '/parent/:path*'],
};
