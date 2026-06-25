'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const setAuthCookie = (session: any) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
        if (projectRef && session) {
            const authCookieName = `sb-${projectRef}-auth-token`;
            const cookieValue = JSON.stringify([session.access_token, session.refresh_token]);
            document.cookie = `${authCookieName}=${encodeURIComponent(cookieValue)}; path=/; max-age=${session.expires_in}; SameSite=Lax;`;
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password || !fullName.trim()) return;
        setError(null);
        setLoading(true);

        try {
            const supabase = getSupabaseBrowser();

            // 🚀 Đăng ký tài khoản kèm lưu Full Name vào user_metadata của Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    }
                }
            });

            if (signUpError) throw signUpError;

            // Nếu Supabase đã tắt bắt xác thực email, cho đăng nhập thẳng luôn
            if (data?.session) {
                setAuthCookie(data.session);
                window.location.href = '/';
            } else {
                setSuccess(true);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to register account';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card" style={{ padding: '40px 30px' }}>

                {/* Tiêu đề trắng nổi bật trên nền tối */}
                <h2 style={{
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: '30px',
                    fontFamily: 'sans-serif'
                }}>
                    Create Account
                </h2>

                {error && <div className="login-error"> {error}</div>}
                {success && (
                    <div className="login-error" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ade80', color: '#4ade80' }}>
                        Account created! You can sign in now.
                    </div>
                )}

                {/* Form flexbox chống dính các ô nhập liệu */}
                <form
                    className="login-form"
                    onSubmit={handleSignUp}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                    {/* Ô NHẬP FULL NAME */}
                    <div className="login-field" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            className="login-input"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Ô NHẬP EMAIL */}
                    <div className="login-field" style={{ marginBottom: 0 }}>
                        <input
                            type="email"
                            className="login-input"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Ô NHẬP PASSWORD */}
                    <div className="login-field" style={{ marginBottom: 0 }}>
                        <input
                            type="password"
                            className="login-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            disabled={loading}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Nút bấm Sign Up cách chữ rộng rãi */}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading || !email.trim() || !password || !fullName.trim()}
                        style={{
                            margin: '12px 0 0 0',
                            padding: '12px 24px',
                            backgroundColor: '#6366f1',
                            background: '#6366f1',
                            color: '#ffffff',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>

                {/* DÒNG ĐIỀU HƯỚNG QUAY LẠI TRANG LOGIN */}
                <p className="login-subtitle" style={{ marginTop: '25px', fontSize: '0.95rem', color: '#9ca3af', textAlign: 'center' }}>
                    Already have an account?{' '}
                    <a
                        href="/login"
                        onClick={(e) => {
                            e.preventDefault();
                            // 🔥 ĐÃ ĐỔI: Sử dụng replace để bẻ gãy bộ nhớ đệm định tuyến cũ, nhảy trang ngay lập tức
                            window.location.replace('/login');
                        }}
                        style={{ color: '#00d2ff', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}
                    >
                        Login
                    </a>
                </p>

            </div>
        </div>
    );
}