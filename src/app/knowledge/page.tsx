'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // 🔥 Đã thêm: Link điều hướng của Next.js
import FileUpload from '@/components/FileUpload';
import KnowledgeFileList from '@/components/KnowledgeFileList';
import type { KBDocument } from '@/components/KnowledgeFileList';

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge');
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data: KBDocument[] = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    // Poll for status updates (documents may be processing)
    const interval = setInterval(loadDocuments, 8000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const handleUploadComplete = () => {
    loadDocuments();
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  if (loading) {
    return (
      <div className="knowledge-page">
        <div className="empty-state">
          <div className="spinner lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-page">
      <div className="knowledge-card">

        {/* 🔥 ĐOẠN CODE MỚI: ĐÃ ĐỒNG BỘ SANG MÀU XANH DƯƠNG GLOW CHUẨN GIAO DIỆN */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#00d2ff', // 🔥 ĐÃ SỬA: Đổi chữ thành màu xanh dương sáng
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '600',
            marginBottom: '20px',
            cursor: 'pointer',
            width: 'fit-content',
            transition: 'opacity 0.2s'
          }}
          className="back-btn-hover"
        >
          <img
            src="/back.png"
            alt="Back Icon"
            style={{
              width: '18px',
              height: '18px',
              objectFit: 'contain',
              // 🔥 MẸO: Ép file ảnh màu tối/tím chuyển sắc sang tone xanh dương rực rỡ để khớp hoàn hảo với chữ
              filter: 'drop-shadow(0 0 2px rgba(0, 210, 255, 0.2)) hue-rotate(190deg) brightness(1.2)'
            }}
          />
          <span>Back to Chat</span>
        </Link>

        {/* Các component giao diện quản lý tài liệu của bạn giữ nguyên vẹn */}
        <h1 className="knowledge-title">
          Add Sources
        </h1>
        <p className="knowledge-subtitle">
          Upload documents to give your AI agent domain-specific knowledge. Files
          are chunked, embedded, and used for RAG-powered responses.
        </p>

        <FileUpload onUploadComplete={handleUploadComplete} />

        <KnowledgeFileList documents={documents} onDelete={handleDelete} />
      </div>
    </div>
  );
}