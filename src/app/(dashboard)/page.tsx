'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatPanel from '@/components/ChatPanel';
import type { Contact } from '@/components/Sidebar';

export default function ChatPage() {
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
    };

    const handleContactUpdate = (updatedContact: Contact) => {
        setSelectedContact(updatedContact);
    };

    return (
        <div className="chat-layout">
            <Sidebar
                onSelectContact={handleSelectContact}
                selectedContactId={selectedContact?.id || null}
            />

            {selectedContact ? (
                <ChatPanel
                    key={selectedContact.id}
                    contact={selectedContact}
                    onContactUpdate={handleContactUpdate}
                />
            ) : (
                <div className="chat-panel">
                    <div className="empty-state">
                        {/* 💬 ĐÃ ĐỔI: Thay emoji cũ bằng file chat.png bản to, làm mờ tinh tế */}
                        <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <img
                                src="/chat.png"
                                alt="No chat selected"
                                style={{ width: '64px', height: '64px', objectFit: 'contain', opacity: 0.4 }}
                            />
                        </div>
                        {/* 📝 ĐÃ ĐỔI: Sửa conversation thành chat/message cho đồng bộ */}
                        <div className="empty-state-title">Select a chat</div>
                        <div className="empty-state-text">
                            Choose a message thread from the sidebar to view their messages and start
                            chatting.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
