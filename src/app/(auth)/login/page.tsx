'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    // Hàm dùng chung để set cookie an toàn
    const setAuthCookie = (session: any) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
        if (projectRef && session) {
            const authCookieName = `sb-${projectRef}-auth-token`;
            const cookieValue = JSON.stringify([session.access_token, session.refresh_token]);
            document.cookie = `${authCookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=${session.expires_in}; SameSite=Lax;`;
        }
    };

    useEffect(() => {
        const supabase = getSupabaseBrowser();

        // Kiểm tra session một cách an toàn và đồng bộ hóa với Server
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
                const authCookieName = `sb-${projectRef}-auth-token`;
                const cookieExists = document.cookie.split('; ').find(row => row.startsWith(`${authCookieName}=`));

                // 🔥 SỬA ĐỔI CHÍNH: Nếu có session cũ nhưng thiếu cookie, set luôn cookie để Server không bị 401
                if (!cookieExists) {
                    setAuthCookie(session);
                }
                window.location.href = '/';
            } else {
                setChecking(false);
            }
        }).catch(() => {
            setChecking(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError(null);
        setLoading(true);

        try {
            const supabase = getSupabaseBrowser();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (authError) throw authError;

            if (data?.session) {
                setAuthCookie(data.session);
            }

            window.location.href = '/';
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="login-page">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <div className="spinner lg" style={{ margin: '2rem auto' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <img
                            src="/logo.jpg"
                            alt="Calva AI Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div className="login-logo-text">Calva AI</div>
                </div>

                <p className="login-subtitle">
                    Welcome to Calva AI · Please sign in to continue.
                </p>

                {error && <div className="login-error">⚠️ {error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            className="login-input"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="login-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading || !email.trim() || !password}
                        id="login-submit-btn"
                        style={{ margin: '10px 0 0 0' }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="login-subtitle" style={{ marginTop: '20px', fontSize: '0.9rem' }}>
                    Don't have an account?{' '}
                    <a
                        href="/signup"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.assign('/signup');
                        }}
                        style={{ color: '#00d2ff', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}
                    >
                        Sign Up
                    </a>
                </p>
                <p className="login-footer">
                    Secured by Supabase Auth · Calva AI Agent v1.0
                </p>
            </div>
        </div>
    );
}