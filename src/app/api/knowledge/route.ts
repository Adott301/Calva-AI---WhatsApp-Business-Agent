import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// ============================================
// GET /api/knowledge — List all KB documents
// ============================================
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('kb_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/knowledge error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
