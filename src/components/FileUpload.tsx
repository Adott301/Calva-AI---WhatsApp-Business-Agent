'use client';

import { useState, useRef, DragEvent } from 'react';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
  'text/markdown',
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.doc,.txt,.csv,.md';

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type || 'unknown'}`);
      return;
    }

    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      onUploadComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      id="file-upload-zone"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="upload-input"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
      />

      {uploading ? (
        <>
          <div className="spinner lg" style={{ margin: '0 auto var(--space-4)' }} />
          <div className="upload-text">Processing document...</div>
          <div className="upload-hint">Extracting text, chunking, and generating embeddings</div>
        </>
      ) : (
        <>
          <span className="upload-icon">📄</span>
          <div className="upload-text">
            Drop files here or click to browse
          </div>
          <div className="upload-hint">
            Supports PDF, DOCX, TXT, CSV, MD — up to 50MB
          </div>
        </>
      )}

      {error && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--font-xs)',
            color: 'var(--status-error)',
          }}
        >
          ❌ {error}
        </div>
      )}
    </div>
  );
}
