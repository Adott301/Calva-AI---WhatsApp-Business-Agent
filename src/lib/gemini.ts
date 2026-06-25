import { GoogleGenAI } from '@google/genai';

// ============================================
// Gemini AI Configuration
// ============================================
const GEMINI_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

// ============================================
// Types
// ============================================
interface GenerateResponseOptions {
  userMessage: string;
  systemPrompt: string;
  ragContext?: string;
  media?: Array<{ data: string; mimeType: string }>;
  history?: Array<{ role: string; text: string }>;
}

// ============================================
// Text Generation
// ============================================

/**
 * Generate a text response using Gemini 2.5 Flash.
 * Supports multimodal input (text + images + documents).
 */
export async function generateResponse({
  userMessage,
  systemPrompt,
  ragContext = '',
  media = [],
  history = [],
}: GenerateResponseOptions): Promise<string> {
  const ai = getAI();

  // Build system instruction with RAG context
  let fullSystemPrompt = systemPrompt;
  if (ragContext) {
    fullSystemPrompt += `\n\n--- KNOWLEDGE BASE CONTEXT ---\nUse the following information to answer the user's question accurately. If the information doesn't contain the answer, say so honestly.\n\n${ragContext}\n--- END CONTEXT ---`;
  }

  // Build conversation content parts
  const userParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  // Add text message
  if (userMessage) {
    userParts.push({ text: userMessage });
  }

  // Add media (images, documents)
  for (const item of media) {
    userParts.push({
      inlineData: {
        data: item.data,
        mimeType: item.mimeType,
      },
    });
  }

  // Build the contents array with history
  const contents: Array<{ role: string; parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> }> = [];

  // Add recent conversation history (last 10 turns for context window efficiency)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  }

  // Add the current user message
  contents.push({
    role: 'user',
    parts: userParts,
  });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: fullSystemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    return response.text || 'I apologize, but I was unable to generate a response.';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini API error:', message);
    throw error;
  }
}

// ============================================
// Embeddings
// ============================================

/**
 * Generate an embedding vector for text.
 *
 * @param text - Text to embed
 * @param taskType - Embedding task type ('RETRIEVAL_DOCUMENT' or 'RETRIEVAL_QUERY')
 * @returns Embedding vector (768 dimensions)
 */
export async function generateEmbedding(
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
  const ai = getAI();

  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    return response.embeddings?.[0]?.values || [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Embedding generation error:', message);
    throw error;
  }
}
