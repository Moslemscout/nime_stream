'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NavbarAuth() {
  const [loggedIn, setLoggedIn] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState('#6d28d9');

  useEffect(() => {
    const stored = localStorage.getItem('user_email');
    setLoggedIn(stored);
    if (stored) {
      setDisplayName(localStorage.getItem('user_display_name'));
      setAvatarColor(localStorage.getItem('user_avatar_color') || '#6d28d9');
      // Sync from DB in background
      syncProfile(stored);
    }

    const onLogin = (e: Event) => {
      const email = (e as CustomEvent).detail;
      setLoggedIn(email);
      syncProfile(email);
    };
    const onLogout = () => {
      setLoggedIn(null);
      setDisplayName(null);
      setAvatarColor('#6d28d9');
    };
    const onProfileUpdate = (e: Event) => {
      const { displayName: dn, avatarColor: ac } = (e as CustomEvent).detail;
      if (dn !== undefined) setDisplayName(dn || null);
      if (ac !== undefined) setAvatarColor(ac);
    };

    window.addEventListener('user-login', onLogin);
    window.addEventListener('user-logout', onLogout);
    window.addEventListener('user-profile-updated', onProfileUpdate);
    return () => {
      window.removeEventListener('user-login', onLogin);
      window.removeEventListener('user-logout', onLogout);
      window.removeEventListener('user-profile-updated', onProfileUpdate);
    };
  }, []);

  const syncProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.displayName) {
        setDisplayName(data.displayName);
        localStorage.setItem('user_display_name', data.displayName);
      }
      if (data.avatarColor) {
        setAvatarColor(data.avatarColor);
        localStorage.setItem('user_avatar_color', data.avatarColor);
      }
    } catch {
      // silent
    }
  };

  const handleLogin = () => {
    const trimmed = inputValue.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      alert('Masukkan email yang valid.');
      return;
    }
    localStorage.setItem('user_email', trimmed);
    setLoggedIn(trimmed);
    setInputValue('');
    window.dispatchEvent(new CustomEvent('user-login', { detail: trimmed }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_display_name');
    localStorage.removeItem('user_avatar_color');
    setLoggedIn(null);
    setDisplayName(null);
    setAvatarColor('#6d28d9');
    window.dispatchEvent(new CustomEvent('user-logout'));
  };

  const maskEmail = (e: string) => {
    const [user, domain] = e.split('@');
    const masked =
      user.length > 3
        ? user.slice(0, 2) + '***' + user.slice(-1)
        : user[0] + '***';
    return `${masked}@${domain}`;
  };

  const navLabel = loggedIn
    ? displayName || maskEmail(loggedIn)
    : '';

  const avatarInitial = loggedIn
    ? (displayName || loggedIn)[0].toUpperCase()
    : '';

  if (loggedIn) {
    return (
      <div className="auth-logged-in">
        <Link href="/user" className="user-chip">
          <div
            className="user-bubble"
            style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)` }}
          >
            {avatarInitial}
          </div>
          <span className="user-nav-label">{navLabel}</span>
        </Link>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>

        <style>{`
          .auth-logged-in {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .user-chip {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(109, 40, 217, 0.12);
            border: 1px solid rgba(109, 40, 217, 0.28);
            padding: 0.28rem 0.9rem 0.28rem 0.28rem;
            border-radius: 999px;
            transition: all 0.2s ease;
            text-decoration: none;
          }
          .user-chip:hover {
            background: rgba(109, 40, 217, 0.22);
            border-color: rgba(109, 40, 217, 0.5);
            transform: translateY(-1px);
          }
          .user-bubble {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.82rem;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .user-nav-label {
            font-size: 0.83rem;
            color: var(--text-main);
            font-weight: 500;
            max-width: 140px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .logout-btn {
            background: rgba(255,255,255,0.05);
            color: var(--text-muted);
            border: 1px solid var(--glass-border);
            padding: 0.4rem 1rem;
            border-radius: 999px;
            font-size: 0.82rem;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .logout-btn:hover {
            background: rgba(248,113,113,0.12);
            color: #f87171;
            border-color: rgba(248,113,113,0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-section">
      <input
        type="email"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        placeholder="Email kamu..."
        className="login-input"
        suppressHydrationWarning
      />
      <button className="login-btn" onClick={handleLogin} suppressHydrationWarning>
        Login
      </button>

      <style>{`
        .login-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          padding: 0.25rem 0.25rem 0.25rem 1rem;
          border-radius: 999px;
          border: 1px solid var(--glass-border);
        }
        .login-input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 0.85rem;
          width: 160px;
        }
        .login-input::placeholder { color: var(--text-muted); opacity: 0.6; }
        .login-btn {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(109,40,217,0.3);
          transition: transform 0.3s ease;
        }
        .login-btn:hover { transform: scale(1.05); }
      `}</style>
    </div>
  );
}
