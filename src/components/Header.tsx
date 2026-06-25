'use client';

import ModeToggle from './ModeToggle';
import type { Contact } from './Sidebar';

interface HeaderProps {
  contact: Contact;
  onModeChange: (newMode: 'ai' | 'human') => void;
}

export default function Header({ contact, onModeChange }: HeaderProps) {
  return (
    <div className="chat-header">
      <div className="chat-header-info">
        {/* ================================================================== */}
        {/* 🔥 ĐÃ FIX ĐỒNG BỘ: Đảm bảo cả Bot và Khách hàng đều hiển thị avatar chuẩn đẹp */}
        {/* ================================================================== */}
        <div
          className="chat-header-avatar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'transparent', // Giữ trong suốt ở lớp cha để không đè nền vuông lên SVG
            boxShadow: 'none'
          }}
        >
          {contact.id === 'system-ai-agent' ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              padding: '0px'
            }}>
              {/* ĐỒ HỌA VECTOR SẮC NÉT - KHÔNG NỀN */}
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="cyber-gradient-header" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="35%" stopColor="#0047ff" />
                    <stop offset="70%" stopColor="#e040ff" />
                    <stop offset="100%" stopColor="#00ff66" />
                  </linearGradient>
                </defs>

                {/* 3 Vòng quỹ đạo nguyên tử */}
                <ellipse cx="50" cy="50" rx="42" ry="15" stroke="url(#cyber-gradient-header)" strokeWidth="2.5" transform="rotate(0 50 50)" />
                <ellipse cx="50" cy="50" rx="42" ry="15" stroke="url(#cyber-gradient-header)" strokeWidth="2.5" transform="rotate(60 50 50)" />
                <ellipse cx="50" cy="50" rx="42" ry="15" stroke="url(#cyber-gradient-header)" strokeWidth="2.5" transform="rotate(120 50 50)" />

                {/* 4 Đầu hạt tròn định vị */}
                <circle cx="14" cy="29" r="3.5" fill="url(#cyber-gradient-header)" />
                <circle cx="86" cy="29" r="3.5" fill="url(#cyber-gradient-header)" />
                <circle cx="14" cy="71" r="3.5" fill="url(#cyber-gradient-header)" />
                <circle cx="86" cy="71" r="3.5" fill="url(#cyber-gradient-header)" />

                {/* Các dấu cộng (+) nhỏ công nghệ */}
                <path d="M26 14H30M28 12V16M70 14H74M72 12V16M26 86H30M28 84V88M70 86H74M72 84V88" stroke="url(#cyber-gradient-header)" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />

                {/* Khung chip AI trung tâm */}
                <rect x="36" y="36" width="28" height="28" rx="5" fill="transparent" stroke="url(#cyber-gradient-header)" strokeWidth="2.5" />

                {/* Các chân vi mạch chip */}
                <path d="M42 32V36M50 32V36M58 32V36M42 64V68M50 64V68M58 64V68M32 42H36M32 50H36M32 58H36M64 42H68M64 50H68M64 58H68" stroke="url(#cyber-gradient-header)" strokeWidth="2" strokeLinecap="round" />

                {/* Chữ AI nằm chính giữa tâm chip */}
                <text x="50" y="55" fill="url(#cyber-gradient-header)" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif" letterSpacing="0.5">AI</text>
              </svg>
            </div>
          ) : (
            // 🚀 ĐÃ CẬP NHẬT: Tạo vòng tròn nền gradient xanh và ép chữ màu trắng cho tất cả khách hàng thường
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22d3ee 0%, #0284c7 100%)', // Khôi phục dải nền xanh cyan-sky sang xịn mịn
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff', // Đảm bảo chữ cái viết tắt luôn có màu trắng tinh rực rỡ
              fontWeight: '700',
              fontSize: '16px',
              userSelect: 'none'
            }}>
              {contact.profile_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <div className="chat-header-name">
            {contact.id === 'system-ai-agent' ? 'Meta Calva AI' : (contact.profile_name || contact.wa_id)}
          </div>
          <div className="chat-header-phone">{contact.wa_id}</div>
        </div>
      </div>
      <div className="chat-header-actions">
        <ModeToggle mode={contact.mode} onToggle={onModeChange} />
      </div>
    </div>
  );
}