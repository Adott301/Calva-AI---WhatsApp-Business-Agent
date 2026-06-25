'use client';

import { useState, useRef } from 'react';

interface MessageInputProps {
  contactId: string;
  mode: 'ai' | 'human';
  onMessageSent: () => void;
}

export default function MessageInput({
  contactId,
  mode,
  onMessageSent,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    // 🔥 PHƯƠNG ÁN 2: Nếu là khách hàng thật VÀ đang ở chế độ AI tự động thì chặn không cho gõ tay
    if (contactId !== 'system-ai-agent' && mode === 'ai') return;

    setSending(true);
    try {
      if (contactId === 'system-ai-agent') {
        // 🔥 PHƯƠNG ÁN 1: Bắn thẳng tin nhắn của Bot ảo sang API AI riêng để xử lý Prompt thực tế
        const res = await fetch('/api/ai-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: message.trim() }),
        });

        if (!res.ok) throw new Error('Failed to send mock AI message');
      } else {
        // LUỒNG CHẠY GỐC: Gửi tin nhắn cho khách hàng thật qua API hệ thống
        const res = await fetch(`/api/messages/${contactId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: message.trim() }),
        });

        if (!res.ok) throw new Error('Failed to send message');
      }

      setMessage('');
      onMessageSent();

      // Re-focus input
      inputRef.current?.focus();
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 🔥 ĐÃ CẬP NHẬT: Cho phép phòng Sandbox Bot ảo luôn mở ô nhập liệu để test Prompt tự động
  if (contactId !== 'system-ai-agent' && mode === 'ai') {
    return (
      <div className="message-input-bar">
        <div className="ai-mode-notice">
          AI Mode is active — messages are handled automatically by the AI agent
        </div>
      </div>
    );
  }

  return (
    <div className="message-input-bar">
      <div className={`message-input-wrapper ${sending ? 'disabled' : ''}`}>
        <textarea
          ref={inputRef}
          className="message-input"
          placeholder={contactId === 'system-ai-agent' ? "Test your AI prompt here..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
          id="message-input"
        />
        {/* 🔥 ĐÃ FIX: Sửa dấu đóng thẻ mở thành dấu > chuẩn xác */}
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!message.trim() || sending}
          title="Send message"
          id="send-message-btn"
        >
          {sending ? (
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : (
            '➤'
          )}
        </button>
      </div>
    </div>
  );
}