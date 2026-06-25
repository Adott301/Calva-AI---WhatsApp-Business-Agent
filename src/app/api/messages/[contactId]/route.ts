import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { sendTextMessage } from '@/lib/whatsapp';

// ============================================
// GET /api/messages/[contactId] — Get paginated messages
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = getSupabaseServer();

    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      messages: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET /api/messages/[contactId] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================
// POST /api/messages/[contactId] — Send message from dashboard (Human mode)
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const { body: messageBody } = await request.json();

    if (!messageBody || messageBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message body is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Get the contact's WhatsApp ID
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('wa_id, profile_name')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Send via WhatsApp API
    const waResponse = await sendTextMessage(contact.wa_id, messageBody.trim());
    const outgoingWaId =
      (waResponse as { messages?: Array<{ id: string }> })?.messages?.[0]?.id || null;

    // Save to database
    const { data: savedMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        contact_id: contactId,
        wa_message_id: outgoingWaId,
        direction: 'outgoing',
        type: 'text',
        body: messageBody.trim(),
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update contact last message timestamp
    await supabase
      .from('contacts')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', contactId);

    console.log(
      `👤 Human replied to ${contact.profile_name}: ${messageBody.substring(0, 80)}`
    );
    return NextResponse.json(savedMessage);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/messages/[contactId] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
