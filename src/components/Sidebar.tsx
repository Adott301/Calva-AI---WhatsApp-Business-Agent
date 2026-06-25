'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================
interface Contact {
  id: string;
  wa_id: string;
  profile_name: string;
  mode: 'ai' | 'human';
  last_message_at: string | null;
  created_at: string;
  last_message: {
    body: string;
    direction: string;
    type: string;
    created_at: string;
  } | null;
}

interface SidebarProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId: string | null;
}

// ============================================
// Sidebar Component
// ============================================
export default function Sidebar({
  onSelectContact,
  selectedContactId,
}: SidebarProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 🤖 CONFIG: Khởi tạo AI Agent hệ thống ảo cố định ở trên cùng với số test Meta
  const systemAiContact: Contact = {
    id: 'system-ai-agent',
    wa_id: '15556782452',
    profile_name: 'Meta Calva AI',
    mode: 'ai',
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_message: {
      body: 'Hệ thống đã sẵn sàng. Hãy chat trực tiếp with tôi để thử nghiệm Prompt!',
      direction: 'incoming',
      type: 'text',
      created_at: new Date().toISOString(),
    }
  };

  const loadContacts = useCallback(async () => {
    // 🔥 CHẶN NGẦM: Kiểm tra nhanh nếu Client chưa có Cookie auth thì ngắt lệnh luôn, tránh tạo request 401 thừa
    if (typeof document !== 'undefined' && !document.cookie.includes('auth-token')) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/contacts');

      // 🔥 XỬ LÝ AN TOÀN: Nếu Server trả về 401, im lặng ngắt lệnh và rút lui, không cố ném ra lỗi đỏ ở console
      if (res.status === 401) {
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data: Contact[] = await res.json();
      setContacts(data);
    } catch (err) {
      // Chỉ in log nếu thực sự là lỗi logic code khác hoặc rớt mạng hệ thống
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
    // Duy trì Refresh danh sách mỗi 10 giây
    const interval = setInterval(loadContacts, 10000);
    return () => clearInterval(interval);
  }, [loadContacts]);

  // 1. Lọc danh sách contacts lấy từ Database theo thanh tìm kiếm
  const filteredDbContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.profile_name?.toLowerCase().includes(q) ||
      c.wa_id?.includes(q)
    );
  });

  // 2. Gộp con Bot hệ thống vào đầu mảng danh sách hiển thị
  const isSystemBotMatched = !searchQuery ||
    systemAiContact.profile_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    systemAiContact.wa_id.includes(searchQuery);

  const displayContacts = isSystemBotMatched
    ? [systemAiContact, ...filteredDbContacts]
    : filteredDbContacts;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span>Messages</span>
          {/* Cập nhật số lượng đếm bao gồm cả con bot hệ thống */}
          <span className="sidebar-count">{displayContacts.length}</span>
        </div>
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            id="contact-search"
            placeholder="Search messages..."
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="contact-list" id="contact-list">
        {loading ? (
          <div className="empty-state">
            <div className="spinner lg" />
          </div>
        ) : displayContacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <img
                src="/chat.png"
                alt="No chats"
                style={{ width: '40px', height: '40px', objectFit: 'contain', opacity: 0.4 }}
              />
            </div>
            <div className="empty-state-title">
              {searchQuery ? 'No results' : 'No messages yet'}
            </div>
            <div className="empty-state-text">
              {searchQuery
                ? 'Try a different search term'
                : 'When users message your WhatsApp number, they will appear here.'}
            </div>
          </div>
        ) : (
          displayContacts.map((contact, i) => (
            <div
              key={contact.id}
              className={`contact-item ${contact.id === selectedContactId ? 'active' : ''}`}
              style={{
                animationDelay: `${i * 40}ms`,
                // HIGHLIGHT: Nếu là Bot hệ thống thì cho thêm viền xanh dương mờ để nổi bật
                border: contact.id === 'system-ai-agent' ? '1px solid rgba(0, 210, 255, 0.3)' : 'none',
                background: contact.id === 'system-ai-agent' && contact.id !== selectedContactId ? 'rgba(0, 210, 255, 0.02)' : ''
              }}
              onClick={() => onSelectContact(contact)}
            >
              {/* VÙNG HIỂN THỊ AVATAR LOGO */}
              <div className="contact-avatar">
                {contact.id === 'system-ai-agent' ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    // 🚀 ĐÃ XOÁ: Để nền trong suốt hoàn toàn nương theo màu chủ đạo của Sidebar
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    boxShadow: 'none',
                    padding: '0px'
                  }}>
                    {/* 🚀 ĐỒ HỌA VECTOR KHÔNG NỀN - HIỂN THỊ TRỰC TIẾP DẢI GRADIENT NỔI BẬT */}
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        {/* Định nghĩa chính xác dải màu: Xanh ngọc -> Xanh biển -> Tím hồng -> Xanh lá */}
                        <linearGradient id="cyber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00f0ff" />
                          <stop offset="35%" stopColor="#0047ff" />
                          <stop offset="70%" stopColor="#e040ff" />
                          <stop offset="100%" stopColor="#00ff66" />
                        </linearGradient>
                      </defs>

                      {/* 3 Vòng quỹ đạo nguyên tử */}
                      <ellipse cx="50" cy="50" rx="42" ry="15" stroke="url(#cyber-gradient)" strokeWidth="2.5" transform="rotate(0 50 50)" />
                      <ellipse cx="50" cy="50" rx="42" ry="15" stroke="url(#cyber-gradient)" strokeWidth="2.5" transform="rotate(60 50 50)" />
                      <ellipse cx="50" cy="50" rx="42" ry="15" stroke="url(#cyber-gradient)" strokeWidth="2.5" transform="rotate(120 50 50)" />

                      {/* 4 Đầu hạt tròn định vị */}
                      <circle cx="14" cy="29" r="3.5" fill="url(#cyber-gradient)" />
                      <circle cx="86" cy="29" r="3.5" fill="url(#cyber-gradient)" />
                      <circle cx="14" cy="71" r="3.5" fill="url(#cyber-gradient)" />
                      <circle cx="86" cy="71" r="3.5" fill="url(#cyber-gradient)" />

                      {/* Các dấu cộng (+) công nghệ xung quanh viền */}
                      <path d="M26 14H30M28 12V16M70 14H74M72 12V16M26 86H30M28 84V88M70 86H74M72 84V88" stroke="url(#cyber-gradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />

                      {/* Khung chip AI trung tâm - 🚀 ĐÃ XOÁ fill="#090d16" để rỗng ruột hoàn toàn */}
                      <rect x="36" y="36" width="28" height="28" rx="5" fill="transparent" stroke="url(#cyber-gradient)" strokeWidth="2.5" />

                      {/* Các chân vi mạch chip */}
                      <path d="M42 32V36M50 32V36M58 32V36M42 64V68M50 64V68M58 64V68M32 42H36M32 50H36M32 58H36M64 42H68M64 50H68M64 58H68" stroke="url(#cyber-gradient)" strokeWidth="2" strokeLinecap="round" />

                      {/* Chữ AI nằm chính giữa tâm chip */}
                      <text x="50" y="55" fill="url(#cyber-gradient)" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.5">AI</text>
                    </svg>
                  </div>
                ) : (
                  <span className="contact-avatar-initial">
                    {getInitial(contact.profile_name)}
                  </span>
                )}
                <span className={`contact-mode-dot ${contact.mode}`} />
              </div>

              <div className="contact-info">
                <div className="contact-name" style={{ fontWeight: contact.id === 'system-ai-agent' ? '700' : 'inherit' }}>
                  {contact.profile_name || contact.wa_id}
                </div>
                <div className="contact-preview">
                  {getPreview(contact)}
                </div>
              </div>
              <div className="contact-meta">
                <span className="contact-time">
                  {contact.id === 'system-ai-agent' ? 'Now' : formatTime(contact.last_message_at)}
                </span>

                <span
                  className={`contact-mode-label ${contact.mode}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {contact.mode === 'ai' ? (
                    <>
                      <img
                        src="/AI.png"
                        alt="AI"
                        style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                      />
                      <span>AI</span>
                    </>
                  ) : (
                    <>
                      <img
                        src="/human.png"
                        alt="Human"
                        style={{ width: '12px', height: '12px', objectFit: 'contain' }}
                      />
                      <span>Human</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function getInitial(name: string | null): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function getPreview(contact: Contact): string {
  if (!contact.last_message) return 'No messages yet';
  const prefix = contact.last_message.direction === 'outgoing' ? 'You: ' : '';
  const body = contact.last_message.body || `[${contact.last_message.type}]`;
  return prefix + body;
}

function formatTime(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (hours < 48) return 'Yesterday';
  if (hours < 168) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export type { Contact };