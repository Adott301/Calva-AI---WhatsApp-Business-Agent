import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// ============================================
// PATCH /api/contacts/[id]/mode — Toggle AI/Human mode
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { mode } = await request.json();

    if (!['ai', 'human'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be "ai" or "human"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('contacts')
      .update({ mode })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    console.log(
      `🔄 Contact ${data.profile_name} mode changed to: ${mode.toUpperCase()}`
    );
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('PATCH /api/contacts/[id]/mode error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
