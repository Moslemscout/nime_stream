'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarColor: string;
  createdAt: string;
  commentCount: number;
}

const AVATAR_COLORS = [
  '#6d28d9', '#db2777', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#7c3aed', '#0284c7',
];

function getInitial(profile: UserProfile) {
  return (profile.displayName || profile.email)[0].toUpperCase();
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  const masked =
    user.length > 3
      ? user.slice(0, 2) + '***' + user.slice(-1)
      : user[0] + '***';
  return `${masked}@${domain}`;
}

export default function UserProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editColor, setEditColor] = useState('#6d28d9');

  useEffect(() => {
    const stored = localStorage.getItem('user_email');
    if (!stored) {
      router.push('/dashboard');
      return;
    }
    setEmail(stored);
    fetchProfile(stored);
  }, []);

  const fetchProfile = async (em: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(em)}`);
      const data = await res.json();
      setProfile(data);
      setEditName(data.displayName || '');
      setEditBio(data.bio || '');
      setEditColor(data.avatarColor || '#6d28d9');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName: editName,
          bio: editBio,
          avatarColor: editColor,
        }),
      });
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, ...data } : data);
      // Update localStorage display name for navbar sync
      localStorage.setItem('user_display_name', editName);
      localStorage.setItem('user_avatar_color', editColor);
      window.dispatchEvent(new CustomEvent('user-profile-updated', {
        detail: { displayName: editName, avatarColor: editColor },
      }));
      setSaveMsg('Profil disimpan!');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_display_name');
    localStorage.removeItem('user_avatar_color');
    window.dispatchEvent(new CustomEvent('user-logout'));
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Memuat profil...</p>
        </div>
        <style>{profileStyles}</style>
      </div>
    );
  }

  if (!profile) return null;

  const displayLabel = profile.displayName || maskEmail(profile.email);
  const joined = new Date(profile.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Back */}
        <Link href="/dashboard" className="back-link">← Kembali</Link>

        {/* Hero Card */}
        <div className="profile-hero">
          {/* Avatar */}
          <div
            className="profile-avatar"
            style={{ background: `linear-gradient(135deg, ${editing ? editColor : profile.avatarColor}, ${editing ? editColor : profile.avatarColor}88)` }}
          >
            {getInitial(profile)}
          </div>

          {editing ? (
            /* ── Edit Mode ── */
            <div className="edit-card">
              <h2 className="edit-title">Edit Profil</h2>

              <div className="form-group">
                <label>Nama Tampilan</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nama kamu..."
                  maxLength={40}
                  className="edit-input"
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Ceritakan sedikit tentang dirimu..."
                  maxLength={200}
                  rows={3}
                  className="edit-input"
                />
                <span className="char-hint">{editBio.length}/200</span>
              </div>

              <div className="form-group">
                <label>Warna Avatar</label>
                <div className="color-picker">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      className={`color-swatch ${editColor === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setEditColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="edit-actions">
                <button className="cancel-btn" onClick={() => setEditing(false)}>Batal</button>
                <button className="save-btn" disabled={saving} onClick={handleSave}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          ) : (
            /* ── View Mode ── */
            <div className="profile-info">
              <div className="profile-name-row">
                <h1 className="profile-name">{displayLabel}</h1>
                <button className="edit-btn" onClick={() => setEditing(true)}>✏️ Edit</button>
              </div>
              <p className="profile-email">{maskEmail(profile.email)}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-meta">
                <span>🗓 Bergabung {joined}</span>
                <span>💬 {profile.commentCount} komentar</span>
              </div>
              {saveMsg && <p className="save-success">{saveMsg}</p>}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-num">{profile.commentCount}</span>
            <span className="stat-label">Komentar</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{joined.split(' ')[2]}</span>
            <span className="stat-label">Tahun Bergabung</span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>Akun</h3>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Keluar dari Akun
          </button>
        </div>
      </div>

      <style>{profileStyles}</style>
    </div>
  );
}

const profileStyles = `
  .profile-page {
    min-height: 80vh;
    padding: 2rem;
  }

  .profile-container {
    max-width: 680px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .back-link {
    display: inline-block;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.2s;
    margin-bottom: 0.5rem;
  }
  .back-link:hover { color: var(--accent); }

  /* Hero card */
  .profile-hero {
    background: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 2.5rem;
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    flex-wrap: wrap;
  }

  /* Avatar */
  .profile-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    transition: transform 0.3s ease;
  }
  .profile-avatar:hover { transform: scale(1.05); }

  /* View Mode */
  .profile-info { flex: 1; min-width: 0; }

  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.3rem;
    flex-wrap: wrap;
  }

  .profile-name {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1;
  }

  .edit-btn {
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.3rem 0.9rem;
    border-radius: 8px;
    background: rgba(109,40,217,0.1);
    border: 1px solid rgba(109,40,217,0.25);
    color: #a78bfa;
    transition: all 0.2s;
  }
  .edit-btn:hover {
    background: rgba(109,40,217,0.2);
    border-color: rgba(109,40,217,0.5);
  }

  .profile-email {
    color: var(--text-muted);
    font-size: 0.88rem;
    margin-bottom: 0.75rem;
  }

  .profile-bio {
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    background: rgba(255,255,255,0.03);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border-left: 3px solid var(--primary);
  }

  .profile-meta {
    display: flex;
    gap: 1.25rem;
    font-size: 0.83rem;
    color: var(--text-muted);
    flex-wrap: wrap;
  }

  .save-success {
    color: #4ade80;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

  /* Edit Mode */
  .edit-card { flex: 1; min-width: 0; }
  .edit-title { font-size: 1.2rem; margin-bottom: 1.25rem; color: var(--text-main); }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }
  .form-group label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .edit-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 0.7rem 1rem;
    color: var(--text-main);
    font-size: 0.92rem;
    transition: border-color 0.2s;
    resize: vertical;
  }
  .edit-input:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(109,40,217,0.05);
  }
  .edit-input::placeholder { color: var(--text-muted); opacity: 0.5; }
  .char-hint { font-size: 0.75rem; color: var(--text-muted); opacity: 0.5; align-self: flex-end; }

  /* Color picker */
  .color-picker { display: flex; gap: 0.6rem; flex-wrap: wrap; }
  .color-swatch {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;
  }
  .color-swatch:hover { transform: scale(1.15); }
  .color-swatch.selected {
    border-color: white;
    box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
    transform: scale(1.2);
  }

  /* Edit actions */
  .edit-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }
  .cancel-btn {
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    color: var(--text-muted);
    font-size: 0.88rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .cancel-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.08); }

  .save-btn {
    padding: 0.6rem 1.5rem;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white;
    font-size: 0.88rem;
    font-weight: 700;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(109,40,217,0.35);
  }
  .save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(109,40,217,0.45); }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
  }
  .stat-box {
    background: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    padding: 1.5rem;
    text-align: center;
    transition: border-color 0.2s;
  }
  .stat-box:hover { border-color: rgba(109,40,217,0.3); }
  .stat-num {
    display: block;
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  .stat-label { font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

  /* Danger Zone */
  .danger-zone {
    background: var(--surface);
    border: 1px solid rgba(248,113,113,0.15);
    border-radius: 14px;
    padding: 1.5rem;
  }
  .danger-zone h3 {
    font-size: 1rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
    font-weight: 600;
  }
  .logout-btn {
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    color: #f87171;
    padding: 0.6rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .logout-btn:hover {
    background: rgba(248,113,113,0.15);
    border-color: rgba(248,113,113,0.4);
    transform: translateY(-1px);
  }

  /* Loading */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 40vh;
    color: var(--text-muted);
  }
  .loading-spinner {
    width: 40px; height: 40px;
    border: 3px solid rgba(109,40,217,0.2);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
