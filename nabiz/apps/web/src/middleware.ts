import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifyAdminCookie } from '@/server/admin-auth';

/**
 * /admin ve /api/admin fail-closed korunur: geçerli oturum damgası yoksa giriş sayfasına
 * (API'de 401'e) düşer. Admin sayfaları ayrıca noindex başlığı taşır.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/admin');
  const isLogin = pathname === '/admin/giris';

  if (isLogin) return NextResponse.next();

  if (!(await verifyAdminCookie(request.cookies.get(ADMIN_COOKIE)?.value))) {
    if (isApi) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = '/admin/giris';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
