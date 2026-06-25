// ============================================
// Text Chunker — Split documents into overlapping chunks
// ============================================

/**
 * Split text into overlapping chunks at sentence boundaries.
 *
 * @param text - Full document text
 * @param chunkSize - Target characters per chunk (default: 500)
 * @param overlap - Overlap characters between chunks (default: 50)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // Try to break at a sentence boundary (. ! ? or newline)
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const lastSentenceEnd = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('! '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('\n')
      );

      if (lastSentenceEnd > chunkSize * 0.3) {
        end = start + lastSentenceEnd + 1;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, accounting for overlap
    start = end - overlap;
    if (start <= (chunks.length > 0 ? start : 0)) {
      start = end;
    }
  }

  return chunks;
}
