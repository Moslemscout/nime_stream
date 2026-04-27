'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh(); // re-render server component to show dashboard
      } else {
        const data = await res.json();
        setError(data.error || 'Password salah.');
        setPassword('');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">▶</div>
          <span className="logo-text">NimeStream</span>
        </div>

        {/* Admin Badge */}
        <div className="admin-login-badge">🔐 Admin Portal</div>

        <h1 className="login-title">Selamat datang kembali</h1>
        <p className="login-subtitle">Masukkan password admin untuk mengakses dashboard</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="admin-password">Password Admin</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="password-input"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="show-pass-btn"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-msg">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="login-submit" disabled={loading || !password}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Memverifikasi...
              </span>
            ) : (
              'Masuk ke Dashboard →'
            )}
          </button>
        </form>

        <p className="login-footer">
          Bukan admin? <a href="/dashboard" className="back-home">Kembali ke beranda</a>
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        /* Background orbs */
        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: rgba(109, 40, 217, 0.18);
          top: -150px; left: -100px;
          animation: float 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: rgba(236, 72, 153, 0.12);
          bottom: -100px; right: -80px;
          animation: float 10s ease-in-out infinite reverse;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 1;
          background: rgba(15, 10, 30, 0.8);
          border: 1px solid rgba(109, 40, 217, 0.25);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 420px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 25px 60px rgba(0,0,0,0.5),
            0 0 0 1px rgba(109,40,217,0.1),
            inset 0 1px 0 rgba(255,255,255,0.05);
          animation: slideUp 0.4s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Logo */
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .logo-icon {
          font-size: 1.6rem;
          color: #ec4899;
          filter: drop-shadow(0 0 10px #ec4899);
        }
        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(to right, #f8fafc, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Admin badge */
        .admin-login-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a78bfa;
          background: rgba(109,40,217,0.12);
          border: 1px solid rgba(109,40,217,0.25);
          padding: 4px 14px;
          border-radius: 999px;
          margin: 0 auto 1.25rem;
          width: fit-content;
        }

        .login-title {
          font-size: 1.6rem;
          font-weight: 800;
          text-align: center;
          color: var(--text-main);
          margin-bottom: 0.4rem;
          background: none;
          -webkit-text-fill-color: var(--text-main);
        }
        .login-subtitle {
          font-size: 0.88rem;
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 2rem;
          opacity: 0.8;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-group label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: rgba(109,40,217,0.5);
          box-shadow: 0 0 0 3px rgba(109,40,217,0.08);
        }

        .input-icon { padding: 0 0.75rem 0 1rem; font-size: 0.9rem; }

        .password-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 0.95rem;
          padding: 0.85rem 0;
          outline: none;
        }
        .password-input::placeholder { color: var(--text-muted); opacity: 0.5; }

        .show-pass-btn {
          padding: 0 1rem;
          font-size: 0.9rem;
          color: var(--text-muted);
          transition: color 0.2s;
          background: transparent;
        }
        .show-pass-btn:hover { color: var(--text-main); }

        .error-msg {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #f87171;
          font-size: 0.88rem;
          text-align: center;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .login-submit {
          width: 100%;
          padding: 0.9rem;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(109,40,217,0.35);
          margin-top: 0.25rem;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(109,40,217,0.45);
        }
        .login-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .back-home {
          color: #a78bfa;
          font-weight: 600;
          transition: color 0.2s;
        }
        .back-home:hover { color: var(--accent); }
      `}</style>
    </div>
  );
}
