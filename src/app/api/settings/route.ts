import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

// ============================================
// GET /api/settings — Get current settings
// ============================================
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      // If no row exists, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: 1,
          system_prompt: 'You are a helpful customer support assistant.',
          updated_at: new Date().toISOString(),
        });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/settings error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
// PUT /api/settings — Update settings (system prompt)
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const { system_prompt } = await request.json();

    if (typeof system_prompt !== 'string') {
      return NextResponse.json(
        { error: 'system_prompt must be a string' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('settings')
      .upsert({
        id: 1,
        system_prompt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log('⚙️  System prompt updated');
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('PUT /api/settings error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
