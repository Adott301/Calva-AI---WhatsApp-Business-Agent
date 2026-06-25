import crypto from 'crypto';

// ============================================
// WhatsApp API Configuration
// ============================================
const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  };
}

// ============================================
// Send Messages
// ============================================

/**
 * Send a text message to a WhatsApp user.
 *
 * @param to - Recipient phone number (E.164 format, no +)
 * @param text - Message text body
 * @param replyToMessageId - Optional message ID to reply to
 * @returns Meta API response
 */
export async function sendTextMessage(
  to: string,
  text: string,
  replyToMessageId: string | null = null
): Promise<Record<string, unknown>> {
  const config = getConfig();

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text },
  };

  if (replyToMessageId) {
    body.context = { message_id: replyToMessageId };
  }

  const res = await fetch(`${BASE_URL}/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error (${res.status}): ${err}`);
  }

  return res.json();
}

// ============================================
// Download Media
// ============================================

/**
 * Download media from WhatsApp.
 * Two-step process: get media URL, then download binary data.
 *
 * @param mediaId - The media ID from the webhook payload
 * @returns Buffer and MIME type of the downloaded media
 */
export async function downloadMedia(
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const config = getConfig();

  // Step 1: Get the media URL
  const metaRes = await fetch(`${BASE_URL}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  });

  if (!metaRes.ok) {
    throw new Error(`Failed to get media URL (${metaRes.status})`);
  }

  const metaData = (await metaRes.json()) as { url: string; mime_type: string };
  const mediaUrl = metaData.url;
  const mimeType = metaData.mime_type;

  // Step 2: Download the binary data
  const mediaRes = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
    },
  });

  if (!mediaRes.ok) {
    throw new Error(`Failed to download media (${mediaRes.status})`);
  }

  const arrayBuffer = await mediaRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return { buffer, mimeType };
}

// ============================================
// Mark as Read
// ============================================

/**
 * Mark a message as read.
 *
 * @param messageId - The WhatsApp message ID
 */
export async function markAsRead(messageId: string): Promise<void> {
  const config = getConfig();

  try {
    await fetch(`${BASE_URL}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to mark message as read:', message);
  }
}

// ============================================
// Webhook Signature Verification
// ============================================

/**
 * Validate the X-Hub-Signature-256 header.
 *
 * @param payload - Raw request body string
 * @param signature - The X-Hub-Signature-256 header value
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const config = getConfig();

  if (!signature) return false;

  const expectedSig =
    'sha256=' +
    crypto
      .createHmac('sha256', config.appSecret)
      .update(payload)
      .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature)
  );
}
