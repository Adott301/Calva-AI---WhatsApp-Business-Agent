import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// ============================================
// DELETE /api/knowledge/[id] — Remove a KB document and its chunks
// ============================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from('kb_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`🗑️  Knowledge base document ${id} deleted`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('DELETE /api/knowledge/[id] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
