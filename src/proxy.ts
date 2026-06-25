import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Các trang cho phép truy cập tự do không cần đăng nhập
const PUBLIC_PATHS = ['/login', '/signup', '/api/webhook'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Cho phép các đường dẫn public đi qua
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Cho phép file tĩnh và internals của Next.js đi qua
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 3. Kiểm tra Session Supabase qua Cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
  const authCookieName = `sb-${projectRef}-auth-token`;
  const authCookie = request.cookies.get(authCookieName);

  // Nếu không có cookie auth -> Ép về login ngay từ server
  if (!authCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Xác thực token hợp lệ
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${JSON.parse(authCookie.value)?.[0]}` },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};