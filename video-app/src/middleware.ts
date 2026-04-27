import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin sub-routes (comments, episodes, edit, etc.)
  // /admin itself is allowed (shows login or dashboard)
  const isSubRoute = pathname.startsWith('/admin/') && pathname !== '/admin/';

  if (isSubRoute) {
    const token = request.cookies.get('admin_token')?.value;
    const valid = token === process.env.ADMIN_SESSION_SECRET;

    if (!valid) {
      const loginUrl = new URL('/admin', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path+'],
};
