import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // 🔥 Thêm thư viện đọc cookie chuẩn của Next.js
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';

    // 🔒 1. LẤY TOKEN THÔNG MINH: Quét cả cookie tự chế lẫn cookie mặc định của Supabase
    const cookieStore = await cookies();
    const customCookie = cookieStore.get(`sb-${projectRef}-auth-token`);

    // Supabase bản mới thường lưu cookie tên là sb-access-token hoặc sb-[project]-auth-token.jwt
    const fallbackCookie = cookieStore.get(`sb-${projectRef}-auth-token.jwt`) || cookieStore.get('sb-access-token');

    let token = '';
    if (customCookie?.value) {
      try {
        token = JSON.parse(decodeURIComponent(customCookie.value))[0];
      } catch {
        token = customCookie.value;
      }
    } else if (fallbackCookie?.value) {
      token = fallbackCookie.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token found' }, { status: 401 });
    }

    // Khởi tạo Supabase Server bằng Token vừa quét được
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Xác thực User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid user' }, { status: 401 });
    }

    // 2. TRUY VẤN DỮ LIỆU: Tìm contact của mình HOẶC contact từ webhook đổ về (NULL)
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        messages (
          body,
          direction,
          type,
          created_at
        )
      `)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    // Chuẩn hóa dữ liệu tin nhắn cuối cùng (giữ nguyên logic cũ của bạn)
    const contacts = (data || []).map((contact: any) => {
      const messages = contact.messages || [];
      messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const lastMessage = messages[0] || null;

      return {
        id: contact.id,
        wa_id: contact.wa_id,
        profile_name: contact.profile_name,
        mode: contact.mode,
        last_message_at: contact.last_message_at,
        created_at: contact.created_at,
        last_message: lastMessage ? {
          body: lastMessage.body,
          direction: lastMessage.direction,
          type: lastMessage.type,
          created_at: lastMessage.created_at,
        } : null,
      };
    });

    return NextResponse.json(contacts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/contacts error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}