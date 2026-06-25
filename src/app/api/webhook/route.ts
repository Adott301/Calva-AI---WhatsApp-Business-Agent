import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { sendTextMessage, downloadMedia, markAsRead } from '@/lib/whatsapp';
import { generateResponse } from '@/lib/gemini';
import { retrieveContext } from '@/lib/rag';

// ============================================
// GET /api/webhook — Webhook verification handshake
// ============================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('❌ Webhook verification failed');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ============================================
// POST /api/webhook — Incoming message handler
// ============================================
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Immediately return 200 to Meta (required within 5 seconds)
  // Process asynchronously after responding
  processWebhook(body).catch((err: Error) => {
    console.error('Webhook processing error:', err.message);
  });

  return NextResponse.json({ status: 'received' }, { status: 200 });
}

// ============================================
// Async Webhook Processing
// ============================================

interface WebhookBody {
  object: string;
  entry?: Array<{
    changes?: Array<{
      field: string;
      value: {
        messages?: Array<WebhookMessage>;
        statuses?: Array<Record<string, unknown>>;
        contacts?: Array<{ profile?: { name?: string } }>;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
      };
    }>;
  }>;
}

interface WebhookMessage {
  from: string;
  id: string;
  type: string;
  timestamp: string;
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type?: string };
  document?: { id: string; caption?: string; filename?: string; mime_type?: string };
}

async function processWebhook(body: WebhookBody) {
  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      const value = change.value;


      if (!value.messages) continue;

      for (const message of value.messages) {
        await handleIncomingMessage(message, value.contacts?.[0], value.metadata);
      }
    }
  }
}

/**
 * Handle a single incoming message.
 */
async function handleIncomingMessage(
  message: WebhookMessage,
  contactInfo?: { profile?: { name?: string } },
  metadata?: { phone_number_id?: string; display_phone_number?: string }
) {
  const supabase = getSupabaseServer();
  const waId = message.from;
  const waMessageId = message.id;
  const messageType = message.type;
  const timestamp = message.timestamp;

  // ===== DUPLICATE MESSAGE FIX =====
  // Skip messages that originated from our own business phone number.
  // When we send a message via the API, Meta echoes it back in the webhook.
  // We detect this by comparing the sender (message.from) against our phone number ID,
  // or by checking if the metadata.display_phone_number matches the sender.
  const ownPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  if (
    metadata?.phone_number_id === waId ||
    metadata?.display_phone_number === waId ||
    waId === ownPhoneNumberId
  ) {
    console.log(`⏭️  Skipping outbound echo from own number: ${waMessageId}`);
    return;
  }

  // Deduplication: check if we already processed this message
  const { data: existing } = await supabase
    .from('messages')
    .select('id')
    .eq('wa_message_id', waMessageId)
    .maybeSingle();

  if (existing) {
    console.log(`⏭️  Duplicate message ${waMessageId}, skipping`);
    return;
  }

  // Upsert contact
  const profileName = contactInfo?.profile?.name || waId;
  const { data: contact } = await supabase
    .from('contacts')
    .upsert(
      {
        wa_id: waId,
        profile_name: profileName,
        last_message_at: new Date(parseInt(timestamp) * 1000).toISOString(),
      },
      { onConflict: 'wa_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (!contact) {
    console.error('Failed to upsert contact for', waId);
    return;
  }

  // Extract message content based on type
  let body = '';
  let mediaUrl: string | null = null;
  let mediaMimeType: string | null = null;
  let mediaFilename: string | null = null;
  let mediaBuffer: Buffer | null = null;

  switch (messageType) {
    case 'text':
      body = message.text?.body || '';
      break;

    case 'image':
      body = message.image?.caption || '[Image]';
      mediaMimeType = message.image?.mime_type || null;
      try {
        const media = await downloadMedia(message.image!.id);
        mediaBuffer = media.buffer;
        mediaMimeType = media.mimeType;
        mediaUrl = `media://${message.image!.id}`;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Media download failed:', errMsg);
      }
      break;

    case 'document':
      body = message.document?.caption || `[Document: ${message.document?.filename || 'file'}]`;
      mediaFilename = message.document?.filename || null;
      mediaMimeType = message.document?.mime_type || null;
      try {
        const media = await downloadMedia(message.document!.id);
        mediaBuffer = media.buffer;
        mediaMimeType = media.mimeType;
        mediaUrl = `media://${message.document!.id}`;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Media download failed:', errMsg);
      }
      break;

    default:
      body = `[Unsupported message type: ${messageType}]`;
  }

  // Save incoming message to database
  await supabase.from('messages').insert({
    contact_id: contact.id,
    wa_message_id: waMessageId,
    direction: 'incoming',
    type: messageType,
    body,
    media_url: mediaUrl,
    media_mime_type: mediaMimeType,
    media_filename: mediaFilename,
  });

  // Mark as read
  markAsRead(waMessageId);

  // If contact is in AI mode, generate and send a response
  if (contact.mode === 'ai') {
    await handleAIResponse(contact, body, mediaBuffer, mediaMimeType, waMessageId);
  }
}

/**
 * Generate an AI response and send it back via WhatsApp.
 */
async function handleAIResponse(
  contact: { id: string; wa_id: string; profile_name: string },
  userMessage: string,
  mediaBuffer: Buffer | null,
  mediaMimeType: string | null,
  replyToId: string
) {
  const supabase = getSupabaseServer();

  try {
    // Get system prompt
    const { data: settings } = await supabase
      .from('settings')
      .select('system_prompt')
      .eq('id', 1)
      .single();

    const systemPrompt = settings?.system_prompt || 'You are a helpful assistant.';

    // Get conversation history (last 10 messages)
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('direction, body')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: true })
      .limit(10);

    const history = (historyMessages || []).map((m: { direction: string; body: string }) => ({
      role: m.direction === 'incoming' ? 'user' : 'model',
      text: m.body || '',
    }));

    // Retrieve RAG context
    const ragContext = await retrieveContext(userMessage);

    // Build media parts for multimodal input
    const media: Array<{ data: string; mimeType: string }> = [];
    if (mediaBuffer && mediaMimeType) {
      media.push({
        data: mediaBuffer.toString('base64'),
        mimeType: mediaMimeType,
      });
    }

    // Generate AI response
    const aiResponse = await generateResponse({
      userMessage,
      systemPrompt,
      ragContext,
      media,
      history,
    });

    // Send the response via WhatsApp
    const waResponse = await sendTextMessage(contact.wa_id, aiResponse, replyToId);
    const outgoingWaId =
      (waResponse as { messages?: Array<{ id: string }> })?.messages?.[0]?.id || null;

    // Save outgoing message to database
    await supabase.from('messages').insert({
      contact_id: contact.id,
      wa_message_id: outgoingWaId,
      direction: 'outgoing',
      type: 'text',
      body: aiResponse,
    });

    // Update contact last message timestamp
    await supabase
      .from('contacts')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', contact.id);

    console.log(
      `🤖 AI replied to ${contact.profile_name}: ${aiResponse.substring(0, 80)}...`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI response error:', message);
  }
}
