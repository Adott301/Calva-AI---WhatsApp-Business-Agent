import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { processAndStoreDocument } from '@/lib/rag';

// ============================================
// Allowed MIME types for knowledge base uploads
// ============================================
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'text/markdown',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================
// POST /api/knowledge/upload — Upload a document to the knowledge base
// ============================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Create document record in DB
    const { data: doc, error } = await supabase
      .from('kb_documents')
      .insert({
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'processing',
      })
      .select()
      .single();

    if (error) throw error;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Respond immediately with the document record
    const response = NextResponse.json(doc);

    // Process asynchronously (extract, chunk, embed, store)
    processAndStoreDocument(doc.id, buffer, file.type).catch((err: Error) => {
      console.error('Background document processing error:', err.message);
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/knowledge/upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
