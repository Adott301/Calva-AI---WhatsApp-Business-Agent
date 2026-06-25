'use client';

import { useState } from 'react';

// ============================================
// Types
// ============================================
interface KBDocument {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  chunk_count: number;
  status: 'processing' | 'ready' | 'error';
  created_at: string;
}

interface KnowledgeFileListProps {
  documents: KBDocument[];
  onDelete: (id: string) => void;
}

// ============================================
// Knowledge File List Component
// ============================================
export default function KnowledgeFileList({
  documents,
  onDelete,
}: KnowledgeFileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onDelete(id);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        📁 Uploaded Documents ({documents.length})
      </div>
      {documents.map((doc, i) => (
        <div
          key={doc.id}
          className="file-item"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`file-icon ${getFileIconClass(doc.mime_type)}`}>
            {getFileEmoji(doc.mime_type)}
          </div>
          <div className="file-info">
            <div className="file-name">{doc.filename}</div>
            <div className="file-meta">
              <span>{formatFileSize(doc.file_size)}</span>
              <span>{doc.chunk_count} chunks</span>
              <span>
                {new Date(doc.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className={`file-status ${doc.status}`}>
            {doc.status === 'processing' && (
              <>
                <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                Processing
              </>
            )}
            {doc.status === 'ready' && '✓ Ready'}
            {doc.status === 'error' && '✗ Error'}
          </div>
          <button
            className="file-delete-btn"
            onClick={() => handleDelete(doc.id)}
            disabled={deletingId === doc.id}
            title="Delete document"
          >
            {deletingId === doc.id ? (
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
            ) : (
              '🗑️'
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function getFileIconClass(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  )
    return 'doc';
  return 'txt';
}

function getFileEmoji(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📕';
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  )
    return '📘';
  return '📝';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export type { KBDocument };
