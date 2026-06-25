// ============================================
// File Processor — Extract text from PDF, DOCX, TXT
// ============================================

import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdf = (pdfParse as any).default || pdfParse;

/**
 * Extract text content from a file buffer based on its MIME type.
 *
 * Supported types:
 * - application/pdf (via pdf-parse)
 * - application/vnd.openxmlformats-officedocument.wordprocessingml.document (via mammoth)
 * - application/msword (via mammoth)
 * - text/plain, text/csv, text/markdown (direct UTF-8 decode)
 *
 * @param buffer - File data as Buffer
 * @param mimeType - MIME type of the file
 * @returns Extracted text content
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text || '';
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    if (
      mimeType === 'text/plain' ||
      mimeType === 'text/csv' ||
      mimeType === 'text/markdown'
    ) {
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Text extraction error for ${mimeType}:`, message);
    throw error;
  }
}
