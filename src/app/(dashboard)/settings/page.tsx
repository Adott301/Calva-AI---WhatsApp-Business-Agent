'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful customer support assistant.');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Tự động load cấu hình cũ từ API khi vào trang
    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.system_prompt) {
                        setSystemPrompt(data.system_prompt);
                    }
                }
            } catch (err) {
                console.error('Failed to load settings:', err);
            }
        }
        loadSettings();
    }, []);

    // Xử lý lưu thay đổi khi nhấn nút Save Changes
    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system_prompt: systemPrompt }),
            });
            if (res.ok) {
                setMessage('Settings saved successfully!');
            } else {
                setMessage('Failed to save settings.');
            }
        } catch (err) {
            setMessage('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="knowledge-page"> {/* Dùng chung class nền với trang knowledge */}
            <div className="knowledge-card" style={{ padding: '40px 30px' }}>

                {/* 🔥 NÚT BACK TO CHAT MÀU XANH DƯƠNG + ICON CHÍNH CHỦ CỦA BẠN */}
                <Link
                    href="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#00d2ff', // Màu xanh dương sáng đồng bộ thương hiệu
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
                            filter: 'drop-shadow(0 0 2px rgba(0, 210, 255, 0.2)) hue-rotate(190deg) brightness(1.2)'
                        }}
                    />
                    <span>Back to Chat</span>
                </Link>

                {/* Tiêu đề Settings giống ảnh image_946809.png */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>

                    <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                        Settings
                    </h1>
                </div>

                <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '1rem' }}>
                    Configure your AI agent's behavior and personality.
                </p>

                {message && (
                    <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '16px', backgroundColor: '#f3f4f6', fontWeight: '500' }}>
                        {message}
                    </div>
                )}

                {/* Khu vực nhập AI System Prompt */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: '600', color: '#4b5563', marginBottom: '12px', fontSize: '1.05rem' }}>
                        AI System Prompt
                    </label>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        style={{
                            width: '100%',
                            height: '200px',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            outline: 'none',
                            resize: 'none'
                        }}
                    />
                </div>

                {/* Nút bấm Save Changes màu xanh neon bo góc */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '12px 28px',
                            backgroundColor: '#7dd3fc',
                            background: '#7dd3fc', // Màu xanh da trời giống trong ảnh của bạn
                            color: '#ffffff',
                            fontWeight: '600',
                            fontSize: '1rem',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
}