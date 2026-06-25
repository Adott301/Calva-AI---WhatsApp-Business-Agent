'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './Header';
import MessageInput from './MessageInput';
import type { Contact } from './Sidebar';

// ============================================
// Types
// ============================================
interface Message {
  id: string;
  contact_id: string;
  wa_message_id: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  body: string;
  media_url: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  status: string;
  created_at: string;
}

interface ChatPanelProps {
  contact: Contact;
  onContactUpdate: (updatedContact: Contact) => void;
}

// ============================================
// Chat Panel Component
// ============================================
export default function ChatPanel({ contact, onContactUpdate }: ChatPanelProps) {
  // Quản lý lịch sử chat giả lập riêng cho con Bot hệ thống
  const [localAiMessages, setLocalAiMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      contact_id: 'system-ai-agent',
      wa_message_id: 'mock-wa-0',
      direction: 'incoming',
      type: 'text',
      body: 'Hệ thống giả lập đã sẵn sàng! Bạn và bạn bè có thể nhập nội dung thử nghiệm Prompt trực tiếp tại đây.',
      media_url: null,
      media_mime_type: null,
      media_filename: null,
      status: 'read',
      created_at: new Date().toISOString()
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    // 🔥 1. ĐỒNG BỘ LOCAL STATE: Nếu là Bot ảo, nạp tin nhắn từ state cục bộ, chặn không gọi API
    if (contact.id === 'system-ai-agent') {
      setMessages(localAiMessages);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/messages/${contact.id}?limit=100&offset=0`);

      // 🔥 2. XỬ LÝ AN TOÀN: Nếu không tìm thấy, trả về mảng rỗng và thoát
      if (res.status === 401 || res.status === 404) {
        setMessages([]);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [contact.id, localAiMessages]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
    // Khởi chạy vòng lặp cập nhật
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (messageAreaRef.current) {
      requestAnimationFrame(() => {
        if (messageAreaRef.current) {
          messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  // Hàm chuyển đổi chế độ an toàn cho Bot ảo và Khách hàng thật
  const handleModeChange = async (newMode: 'ai' | 'human') => {
    if (contact.id === 'system-ai-agent') {
      onContactUpdate({ ...contact, mode: newMode });
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${contact.id}/mode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      if (!res.ok) return; // Chặn crash nếu lỗi
      const updatedContact = await res.json();
      onContactUpdate({ ...contact, ...updatedContact });
    } catch (err) {
      console.error('Mode change error:', err);
    }
  };

  // 🔥 ĐỒNG BỘ AI THẬT: Đọc luồng dữ liệu Streaming thô (textStream) từ Gemini API và Vercel AI SDK
  const handleMessageSent = async () => {
    if (contact.id === 'system-ai-agent') {
      const inputEl = document.querySelector('#message-input') as HTMLInputElement | HTMLTextAreaElement;
      const userText = inputEl?.value || "";

      if (!userText.trim()) {
        loadMessages();
        return;
      }

      // Tạo ngay một tin nhắn rỗng của AI trên màn hình để chuẩn bị hứng chữ đổ về
      const aiMessageId = `real-ai-${Date.now()}`;
      const newAiMessage: Message = {
        id: aiMessageId,
        contact_id: 'system-ai-agent',
        wa_message_id: `mock-wa-${Date.now()}`,
        direction: 'incoming',
        type: 'text',
        body: '🤖 Đang suy nghĩ...', // Trạng thái chờ phản hồi ban đầu
        media_url: null,
        media_mime_type: null,
        media_filename: null,
        status: 'read',
        created_at: new Date().toISOString()
      };

      // Đẩy tin nhắn tạm này vào danh sách hiển thị cục bộ
      setLocalAiMessages(prev => [...prev, newAiMessage]);

      try {
        const res = await fetch('/api/ai-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: userText.trim() }),
        });

        if (!res.ok || !res.body) {
          throw new Error('Không thể kết nối luồng AI');
        }

        // Kích hoạt bộ đọc luồng Stream từ Server đổ về
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let textAccumulated = ''; // Biến tích lũy lưu trữ từ ngữ chạy ra

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunk = decoder.decode(value, { stream: !done });

          // Nhận trực tiếp chuỗi thô từ StreamingTextResponse, không cần lọc chuỗi '0:' phức tạp
          textAccumulated += chunk;

          if (textAccumulated) {
            // Cập nhật liên tục từng chữ hiển thị lên giao diện trong thời gian thực (Real-time)
            setLocalAiMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, body: textAccumulated }
                  : msg
              )
            );
          }
        }
      } catch (err) {
        console.error('Lỗi luồng streaming AI:', err);
        setLocalAiMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, body: '❌ Không thể lấy phản hồi từ AI. Vui lòng kiểm tra lại cấu hình GOOGLE_GENERATIVE_AI_API_KEY trong file .env.' }
              : msg
          )
        );
      }
    }

    // Refresh lại giao diện hiển thị tổng
    loadMessages();
  };

  return (
    <div className="chat-panel">
      <Header contact={contact} onModeChange={handleModeChange} />

      <div className="message-area" id="message-area" ref={messageAreaRef}>
        {loading ? (
          <div className="empty-state">
            <div className="spinner lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">No messages yet</div>
            <div className="empty-state-text">
              Messages will appear here when the conversation starts.
            </div>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      <MessageInput
        contactId={contact.id}
        mode={contact.mode}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
}

// ============================================
// Message List Sub-Component
// ============================================
function MessageList({ messages }: { messages: Message[] }) {
  let lastDate = '';

  return (
    <>
      {messages.map((msg) => {
        const msgDate = new Date(msg.created_at).toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        const showDateSeparator = msgDate !== lastDate;
        if (showDateSeparator) lastDate = msgDate;

        const isOutgoing = msg.direction === 'outgoing';
        const bubbleClass = isOutgoing ? 'outgoing' : 'incoming';
        const time = new Date(msg.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={msg.id}>
            {showDateSeparator && (
              <div className="message-date-separator">
                <span>{msgDate}</span>
              </div>
            )}
            <div className={`message-bubble ${bubbleClass}`}>
              {msg.type === 'image' && (
                <div className="message-type-badge">🖼️ Image</div>
              )}
              {msg.type === 'document' && (
                <div className="message-type-badge">
                  📄 {msg.media_filename || 'Document'}
                </div>
              )}
              <div className="message-body">{msg.body || ''}</div>
              <div className="message-time">{time}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}