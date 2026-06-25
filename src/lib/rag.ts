// ============================================
// RAG Pipeline — Retrieval Augmented Generation
// ============================================

import { getSupabaseServer } from './supabase';
import { generateEmbedding } from './gemini';
import { extractText } from './fileProcessor';
import { chunkText } from './chunker';

/**
 * Retrieve relevant context from the knowledge base using semantic search.
 *
 * @param query - The user's query text
 * @param matchCount - Number of results to return (default: 5)
 * @param threshold - Minimum similarity threshold (default: 0.4)
 * @returns Concatenated relevant context string
 */
export async function retrieveContext(
  query: string,
  matchCount: number = 5,
  threshold: number = 0.4
): Promise<string> {
  try {
    const supabase = getSupabaseServer();

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, 'RETRIEVAL_QUERY');

    // Search for similar chunks in Supabase
    const { data, error } = await supabase.rpc('match_kb_chunks', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('RAG search error:', error.message);
      return '';
    }

    if (!data || data.length === 0) {
      return '';
    }

    // Concatenate relevant chunks as context
    const context = data
      .map(
        (chunk: { similarity: number; content: string }, i: number) =>
          `[Source ${i + 1} (relevance: ${(chunk.similarity * 100).toFixed(1)}%)]\n${chunk.content}`
      )
      .join('\n\n');

    return context;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('RAG retrieval error:', message);
    return '';
  }
}

/**
 * Process and store a document in the knowledge base.
 * Full pipeline: extract text → chunk → generate embeddings → insert into Supabase.
 *
 * @param documentId - The KB document ID in the database
 * @param fileBuffer - The file data as Buffer
 * @param mimeType - The file's MIME type
 */
export async function processAndStoreDocument(
  documentId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<void> {
  const supabase = getSupabaseServer();

  try {
    // Extract text from the document
    const text = await extractText(fileBuffer, mimeType);

    if (!text || text.trim().length === 0) {
      await supabase
        .from('kb_documents')
        .update({ status: 'error', chunk_count: 0 })
        .eq('id', documentId);
      return;
    }

    // Chunk the text
    const chunks = chunkText(text, 500, 50);

    // Generate embeddings and insert chunks in batches
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const rows: Array<{
        document_id: string;
        content: string;
        chunk_index: number;
        embedding: string;
      }> = [];

      for (let j = 0; j < batch.length; j++) {
        const embedding = await generateEmbedding(batch[j], 'RETRIEVAL_DOCUMENT');
        rows.push({
          document_id: documentId,
          content: batch[j],
          chunk_index: i + j,
          embedding: JSON.stringify(embedding),
        });
      }

      const { error } = await supabase.from('kb_chunks').insert(rows);
      if (error) {
        console.error(`Chunk insert error (batch ${i}):`, error.message);
      } else {
        insertedCount += rows.length;
      }
    }

    // Update document status
    await supabase
      .from('kb_documents')
      .update({ status: 'ready', chunk_count: insertedCount })
      .eq('id', documentId);

    console.log(
      `✅ Knowledge base document processed: ${insertedCount} chunks created`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Document processing error:', message);
    await supabase
      .from('kb_documents')
      .update({ status: 'error' })
      .eq('id', documentId);
  }
}
