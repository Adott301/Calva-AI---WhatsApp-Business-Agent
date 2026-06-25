-- ============================================
-- WhatsApp AI Agent — Supabase Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor to set up the database.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Contacts table: stores WhatsApp user profiles
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_id TEXT UNIQUE NOT NULL,
  profile_name TEXT,
  mode TEXT DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Messages table: stores all conversation messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  wa_message_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  type TEXT DEFAULT 'text',
  body TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  media_filename TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Settings table: singleton row for app config
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  system_prompt TEXT DEFAULT 'You are a helpful customer support assistant.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Knowledge base documents
-- ============================================
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Knowledge base chunks with vector embeddings
-- ============================================
CREATE TABLE IF NOT EXISTS kb_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES kb_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_wa_id ON contacts(wa_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_message ON contacts(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON kb_chunks(document_id);

-- HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding ON kb_chunks
  USING hnsw (embedding vector_cosine_ops);

-- ============================================
-- RPC: Similarity search function
-- ============================================
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, content TEXT, similarity FLOAT, document_id UUID)
LANGUAGE sql STABLE
AS $$
  SELECT
    kb_chunks.id,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) AS similarity,
    kb_chunks.document_id
  FROM kb_chunks
  WHERE 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- Enable Realtime for messages and contacts
-- ============================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE contacts REPLICA IDENTITY FULL;

-- ============================================
-- Insert default settings row
-- ============================================
INSERT INTO settings (system_prompt)
VALUES ('You are a helpful customer support assistant. Be polite, concise, and helpful.')
ON CONFLICT (id) DO NOTHING;
