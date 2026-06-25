'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [theme, setTheme] = useState<Theme>('dark');
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // --- Theme initialization ---
    useEffect(() => {
        const saved = localStorage.getItem('wa-theme') as Theme | null;
        const initial = saved || 'dark';
        setTheme(initial);
        document.documentElement.setAttribute('data-theme', initial);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next: Theme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('wa-theme', next);
            document.documentElement.setAttribute('data-theme', next);
            return next;
        });
    }, []);

    // --- Auth check (Chỉ bảo vệ các trang Dashboard) ---
    useEffect(() => {
        const supabase = getSupabaseBrowser();

        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
            setAuthChecked(true);
            if (!session) {
                window.location.href = '/login';
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
            if (!session) {
                window.location.href = '/login';
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        const supabase = getSupabaseBrowser();
        await supabase.auth.signOut();

        // Xóa cookie bảo mật
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
        if (projectRef) {
            document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        }
        window.location.href = '/login';
    };

    // Định nghĩa biến cấu hình bộ lọc xám trung tính dùng chung cho tất cả các icon hình ảnh tĩnh màu đen
    const grayIconFilter = 'invert(0.5) brightness(1.2) contrast(0.8)';

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className="app-shell" data-theme={theme}>
                <nav className="nav-bar">
                    {/* Bấm vào Logo chuyển ngầm về trang chủ không lộ link */}
                    <div
                        className="nav-brand"
                        onClick={() => router.push('/')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="nav-brand-icon" style={{ background: 'none', boxShadow: 'none', padding: 0, overflow: 'hidden' }}>
                            <img
                                src="/logo.jpg"
                                alt="Calva AI Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                            />
                        </div>
                        <span className="nav-brand-text">Calva AI</span>
                        <span className="nav-brand-badge">AI Powered</span>
                    </div>

                    <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

                        {/* 1. NÚT CHAT */}
                        <button
                            onClick={() => router.push('/')}
                            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                            style={{
                                background: 'none',
                                border: 'none',
                                font: 'inherit',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span className="nav-link-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <img
                                    src="/chat.png"
                                    alt="Chat Icon"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        objectFit: 'contain',
                                        filter: grayIconFilter // 🔥 ĐÃ SỬA: Ép icon chat sang màu xám
                                    }}
                                />
                            </span>
                            Chat
                        </button>

                        {/* 2. NÚT ADD SOURCES */}
                        <button
                            onClick={() => router.push('/knowledge')}
                            className={`nav-link ${pathname === '/knowledge' ? 'active' : ''}`}
                            style={{
                                background: 'none',
                                border: 'none',
                                font: 'inherit',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span className="nav-link-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <img
                                    src="/add.png"
                                    alt="Add Sources Icon"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        objectFit: 'contain',
                                        filter: grayIconFilter // 🔥 ĐÃ SỬA: Ép icon dấu cộng sang màu xám
                                    }}
                                />
                            </span>
                            Add Sources
                        </button>

                        {/* 3. NÚT SETTINGS */}
                        <button
                            onClick={() => router.push('/settings')}
                            className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}
                            style={{
                                background: 'none',
                                border: 'none',
                                font: 'inherit',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span className="nav-link-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <img
                                    src="/setting.png"
                                    alt="Settings Icon"
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        objectFit: 'contain',
                                        filter: grayIconFilter // 🔥 ĐÃ SỬA: Ép icon răng cưa sang màu xám
                                    }}
                                />
                            </span>
                            Settings
                        </button>

                        <div className="nav-divider" />

                        {/* 4. NÚT CHUYỂN LIGHT / DARK MODE */}
                        <button className="nav-icon-btn" onClick={toggleTheme} id="theme-toggle-btn">
                            {theme === 'dark' ? (
                                <img
                                    src="/darkmode.png"
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        objectFit: 'contain',
                                        filter: grayIconFilter // 🔥 ĐÃ SỬA: Ép icon mặt trăng sang màu xám
                                    }}
                                />
                            ) : (
                                <img
                                    src="/lightmode.png"
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        objectFit: 'contain',
                                        filter: grayIconFilter // 🔥 ĐÃ SỬA: Ép icon mặt trời sang màu xám
                                    }}
                                />
                            )}
                        </button>

                        {/* 5. NÚT ĐĂNG XUẤT (LOGOUT) */}
                        <button className="nav-icon-btn" onClick={handleLogout} id="logout-btn">
                            <img
                                src="/logout.png"
                                alt="Logout"
                                style={{
                                    width: '22px',
                                    height: '22px',
                                    objectFit: 'contain',
                                    filter: grayIconFilter // 🔥 ĐÃ SỬA: Ép icon logout sang màu xám
                                }}
                            />
                        </button>
                    </div>
                </nav>

                {/* Phần nội dung chính: Chỉ render children khi đã xác thực xong xuôi */}
                <div className="main-content">
                    {!authChecked || !isAuthenticated ? (
                        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="spinner lg" />
                        </div>
                    ) : (
                        children
                    )}
                </div>
            </div>
        </ThemeContext.Provider>
    );
}