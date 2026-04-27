'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  videoId: string;
  videoTitle: string;
  email: string;
  existingLists: string[];                    // semua list nama user
  savedInLists: string[];                     // list yang sudah contain video ini
  onClose: () => void;
  onSave: (listName: string) => void;
  onRemove: (listName: string) => void;
}

export default function AddToWatchlistModal({
  videoId, videoTitle, email,
  existingLists, savedInLists,
  onClose, onSave, onRemove,
}: Props) {
  const [newListName, setNewListName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on backdrop click / Escape
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSaveToNew = async () => {
    const name = newListName.trim();
    if (!name) { setError('Nama list tidak boleh kosong.'); return; }
    if (name.length > 30) { setError('Nama maksimal 30 karakter.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(name);
      setNewListName('');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleExisting = async (listName: string) => {
    setSaving(true);
    try {
      if (savedInLists.includes(listName)) {
        await onRemove(listName);
      } else {
        await onSave(listName);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wl-backdrop" onClick={handleBackdrop}>
      <div className="wl-modal">
        {/* Header */}
        <div className="wl-header">
          <div>
            <h2 className="wl-title">🔖 Simpan ke Watchlist</h2>
            <p className="wl-subtitle" title={videoTitle}>
              {videoTitle.length > 40 ? videoTitle.slice(0, 40) + '...' : videoTitle}
            </p>
          </div>
          <button className="wl-close" onClick={onClose}>✕</button>
        </div>

        {/* Existing lists */}
        {existingLists.length > 0 && (
          <div className="wl-section">
            <p className="wl-section-label">List kamu</p>
            <div className="wl-list-items">
              {existingLists.map(name => {
                const saved = savedInLists.includes(name);
                return (
                  <button
                    key={name}
                    className={`wl-list-item ${saved ? 'saved' : ''}`}
                    onClick={() => handleToggleExisting(name)}
                    disabled={saving}
                  >
                    <span className="wl-list-icon">{saved ? '✅' : '📋'}</span>
                    <span className="wl-list-name">{name}</span>
                    {saved && <span className="wl-list-check">Tersimpan</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Create new list */}
        <div className="wl-section">
          <p className="wl-section-label">
            {existingLists.length > 0 ? 'Buat list baru' : 'Buat watchlist pertamamu'}
          </p>
          <div className="wl-new-row">
            <input
              ref={inputRef}
              type="text"
              value={newListName}
              onChange={e => { setNewListName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSaveToNew()}
              placeholder="Nama list... (misal: Agus, Favoritku)"
              maxLength={30}
              className="wl-input"
            />
            <button
              className="wl-add-btn"
              onClick={handleSaveToNew}
              disabled={saving || !newListName.trim()}
            >
              {saving ? '...' : '+ Buat'}
            </button>
          </div>
          {error && <p className="wl-error">{error}</p>}
          <p className="wl-hint">{newListName.length}/30 karakter</p>
        </div>

        {/* Status */}
        {savedInLists.length > 0 && (
          <div className="wl-status">
            Tersimpan di: {savedInLists.map(l => (
              <span key={l} className="wl-status-tag">{l}</span>
            ))}
          </div>
        )}
      </div>

      <style>{modalStyles}</style>
    </div>
  );
}

const modalStyles = `
  .wl-backdrop {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    animation: fadeInBg 0.15s ease;
  }
  @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }

  .wl-modal {
    background: #13101f;
    border: 1px solid rgba(109,40,217,0.3);
    border-radius: 20px;
    padding: 1.75rem;
    width: 100%; max-width: 420px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(109,40,217,0.1);
    animation: slideUpModal 0.25s cubic-bezier(0.175,0.885,0.32,1.275);
    display: flex; flex-direction: column; gap: 1.25rem;
  }
  @keyframes slideUpModal {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Header */
  .wl-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 1rem;
  }
  .wl-title {
    font-size: 1.1rem; font-weight: 800;
    color: var(--text-main); margin-bottom: 0.2rem;
  }
  .wl-subtitle {
    font-size: 0.82rem; color: var(--text-muted);
  }
  .wl-close {
    font-size: 0.9rem; color: var(--text-muted);
    padding: 4px 8px; border-radius: 6px;
    background: rgba(255,255,255,0.05);
    transition: all 0.15s; flex-shrink: 0;
  }
  .wl-close:hover { background: rgba(255,255,255,0.1); color: var(--text-main); }

  /* Section */
  .wl-section { display: flex; flex-direction: column; gap: 0.6rem; }
  .wl-section-label {
    font-size: 0.75rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  /* Existing list items */
  .wl-list-items { display: flex; flex-direction: column; gap: 0.4rem; }
  .wl-list-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.65rem 1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--glass-border);
    border-radius: 10px; cursor: pointer;
    transition: all 0.15s; text-align: left;
  }
  .wl-list-item:hover:not(:disabled) {
    background: rgba(109,40,217,0.08);
    border-color: rgba(109,40,217,0.3);
  }
  .wl-list-item.saved {
    background: rgba(109,40,217,0.1);
    border-color: rgba(109,40,217,0.35);
  }
  .wl-list-item:disabled { opacity: 0.6; cursor: not-allowed; }
  .wl-list-icon { font-size: 1.1rem; flex-shrink: 0; }
  .wl-list-name { flex: 1; font-size: 0.92rem; color: var(--text-main); font-weight: 500; }
  .wl-list-check {
    font-size: 0.72rem; font-weight: 600;
    color: #a78bfa; background: rgba(109,40,217,0.15);
    padding: 1px 8px; border-radius: 999px;
  }

  /* New list input */
  .wl-new-row { display: flex; gap: 0.5rem; }
  .wl-input {
    flex: 1; background: rgba(255,255,255,0.05);
    border: 1px solid var(--glass-border);
    border-radius: 10px; padding: 0.65rem 1rem;
    color: var(--text-main); font-size: 0.9rem;
    outline: none; transition: border-color 0.2s;
  }
  .wl-input:focus {
    border-color: rgba(109,40,217,0.5);
    box-shadow: 0 0 0 3px rgba(109,40,217,0.08);
  }
  .wl-input::placeholder { color: var(--text-muted); opacity: 0.5; }

  .wl-add-btn {
    padding: 0.65rem 1.1rem;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border-radius: 10px;
    font-size: 0.88rem; font-weight: 700;
    transition: all 0.2s; white-space: nowrap;
    box-shadow: 0 4px 12px rgba(109,40,217,0.3);
  }
  .wl-add-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(109,40,217,0.4);
  }
  .wl-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .wl-error { font-size: 0.82rem; color: #f87171; }
  .wl-hint { font-size: 0.72rem; color: var(--text-muted); opacity: 0.5; }

  /* Status */
  .wl-status {
    display: flex; align-items: center; flex-wrap: wrap;
    gap: 0.4rem; font-size: 0.8rem; color: var(--text-muted);
    background: rgba(109,40,217,0.06);
    border: 1px solid rgba(109,40,217,0.15);
    border-radius: 10px; padding: 0.6rem 0.9rem;
  }
  .wl-status-tag {
    background: rgba(109,40,217,0.18);
    color: #a78bfa; font-weight: 600; font-size: 0.78rem;
    padding: 2px 9px; border-radius: 999px;
  }
`;
