'use client';

import { useState, useEffect, useRef } from 'react';

interface Reply {
  id: string;
  content: string;
  userEmail: string;
  createdAt: string;
  approved: boolean;
  parentId: string;
}

interface Comment {
  id: string;
  content: string;
  userEmail: string;
  createdAt: string;
  approved: boolean;
  parentId: null;
  replies: Reply[];
}

interface CommentSectionProps {
  videoId: string;
  episodeId?: string;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  const masked =
    user.length > 3
      ? user.slice(0, 2) + '***' + user.slice(-1)
      : user[0] + '***';
  return `${masked}@${domain}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

// ── Reply Form ────────────────────────────────────────────────────────────────
function ReplyForm({
  parentId,
  videoId,
  episodeId,
  userEmail,
  onSuccess,
  onCancel,
}: {
  parentId: string;
  videoId: string;
  episodeId?: string;
  userEmail: string;
  onSuccess: (reply: Reply) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          userEmail,
          videoId,
          episodeId: episodeId || null,
          parentId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
        setText('');
      } else {
        const d = await res.json();
        setError(d.error || 'Gagal mengirim balasan.');
      }
    } catch {
      setError('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="reply-form" onSubmit={submit}>
      <div className="reply-form-inner">
        <div className="rf-avatar">{userEmail[0].toUpperCase()}</div>
        <div className="rf-right">
          <textarea
            ref={textareaRef}
            className="rf-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tulis balasan..."
            rows={2}
            maxLength={500}
          />
          {error && <p className="rf-error">{error}</p>}
          <div className="rf-actions">
            <button type="button" className="rf-cancel" onClick={onCancel}>
              Batal
            </button>
            <button type="submit" className="rf-submit" disabled={loading || !text.trim()}>
              {loading ? '...' : 'Balas'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Single Comment Card ───────────────────────────────────────────────────────
function CommentCard({
  comment,
  userEmail,
  videoId,
  episodeId,
  onReplyAdded,
}: {
  comment: Comment;
  userEmail: string | null;
  videoId: string;
  episodeId?: string;
  onReplyAdded: (commentId: string, reply: Reply) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className="comment-card">
      {/* Top-level comment */}
      <div className="comment-row">
        <div className="cm-avatar">{comment.userEmail[0].toUpperCase()}</div>
        <div className="cm-body">
          <div className="cm-meta">
            <span className="cm-author">{maskEmail(comment.userEmail)}</span>
            <span className="cm-time">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="cm-text">{comment.content}</p>
          {userEmail && (
            <button
              className="reply-trigger"
              onClick={() => setShowReplyForm(v => !v)}
            >
              {showReplyForm ? '▾ Batal' : '↩ Balas'}
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="replies-list">
          {comment.replies.map(reply => (
            <div key={reply.id} className="reply-row">
              <div className="reply-connector" />
              <div className="cm-avatar cm-avatar-sm">{reply.userEmail[0].toUpperCase()}</div>
              <div className="cm-body">
                <div className="cm-meta">
                  <span className="cm-author">{maskEmail(reply.userEmail)}</span>
                  <span className="cm-time">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="cm-text">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && userEmail && (
        <div className="reply-form-wrapper">
          <ReplyForm
            parentId={comment.id}
            videoId={videoId}
            episodeId={episodeId}
            userEmail={userEmail}
            onSuccess={reply => {
              onReplyAdded(comment.id, reply);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Main CommentSection ───────────────────────────────────────────────────────
export default function CommentSection({ videoId, episodeId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('user_email');
    setUserEmail(email);
    fetchComments();

    const onLogin = (e: Event) => setUserEmail((e as CustomEvent).detail);
    const onLogout = () => setUserEmail(null);
    window.addEventListener('user-login', onLogin);
    window.addEventListener('user-logout', onLogout);
    return () => {
      window.removeEventListener('user-login', onLogin);
      window.removeEventListener('user-logout', onLogout);
    };
  }, [videoId, episodeId]);

  const fetchComments = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ videoId });
      if (episodeId) params.append('episodeId', episodeId);
      const res = await fetch(`/api/comments?${params}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !content.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          userEmail,
          videoId,
          episodeId: episodeId || null,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setContent('');
        setSuccess('Komentar berhasil dikirim!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const d = await res.json();
        setError(d.error || 'Gagal mengirim komentar.');
      }
    } catch {
      setError('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyAdded = (commentId: string, reply: Reply) => {
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, reply] }
          : c
      )
    );
  };

  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0
  );

  return (
    <div className="comment-section">
      <h3 className="comment-heading">
        💬 Komentar ({totalCount})
      </h3>

      {/* New Comment Form */}
      {userEmail ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="form-user-info">
            <div className="user-avatar">{userEmail[0].toUpperCase()}</div>
            <span className="user-email-label">{maskEmail(userEmail)}</span>
          </div>
          <textarea
            className="comment-input"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Tulis komentarmu di sini..."
            rows={3}
            maxLength={500}
            required
          />
          <div className="form-footer">
            <span className="char-count">{content.length}/500</span>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !content.trim()}
            >
              {loading ? <span className="spinner" /> : 'Kirim Komentar'}
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
        </form>
      ) : (
        <div className="login-prompt">
          <span className="lock-icon">🔒</span>
          <p>Silakan <strong>login dengan email</strong> untuk berkomentar.</p>
        </div>
      )}

      {/* Comment List */}
      <div className="comments-list">
        {fetching ? (
          <div className="comments-loading">
            {[1, 2, 3].map(i => <div key={i} className="comment-skeleton" />)}
          </div>
        ) : comments.length === 0 ? (
          <div className="no-comments">Belum ada komentar. Jadilah yang pertama!</div>
        ) : (
          comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              userEmail={userEmail}
              videoId={videoId}
              episodeId={episodeId}
              onReplyAdded={handleReplyAdded}
            />
          ))
        )}
      </div>

      <style>{`
        .comment-section {
          background: var(--surface);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid var(--glass-border);
          margin-top: 1.5rem;
        }

        .comment-heading {
          font-size: 1.2rem;
          color: var(--text-main);
          margin-bottom: 1.5rem;
        }

        /* Login Prompt */
        .login-prompt {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(109, 40, 217, 0.08);
          border: 1px solid rgba(109, 40, 217, 0.2);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          margin-bottom: 2rem;
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .login-prompt strong { color: var(--accent); }
        .lock-icon { font-size: 1.3rem; }

        /* Main Comment Form */
        .comment-form {
          margin-bottom: 2rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .form-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; color: white; flex-shrink: 0;
        }

        .user-email-label { color: var(--text-muted); font-size: 0.85rem; }

        .comment-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--text-main);
          font-size: 0.95rem;
          resize: vertical;
          transition: border-color 0.2s;
          min-height: 80px;
        }
        .comment-input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(109,40,217,0.05);
        }
        .comment-input::placeholder { color: var(--text-muted); opacity: 0.6; }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.75rem;
        }
        .char-count { font-size: 0.78rem; color: var(--text-muted); opacity: 0.6; }

        .submit-btn {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          transition: all 0.2s;
          min-width: 130px;
          display: flex; align-items: center; justify-content: center;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(109,40,217,0.4);
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-error { color: #f87171; font-size: 0.85rem; margin-top: 0.5rem; }
        .form-success { color: #4ade80; font-size: 0.85rem; margin-top: 0.5rem; }

        /* Comments List */
        .comments-list { display: flex; flex-direction: column; gap: 0; }

        .comments-loading { display: flex; flex-direction: column; gap: 0.75rem; }
        .comment-skeleton {
          height: 70px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .no-comments {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem;
          font-size: 0.95rem;
          opacity: 0.7;
        }

        /* Comment Card */
        .comment-card {
          border-bottom: 1px solid var(--glass-border);
          padding: 1.25rem 0;
        }
        .comment-card:last-child { border-bottom: none; }

        .comment-row {
          display: flex;
          gap: 0.9rem;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn {
          from { opacity:0; transform: translateY(6px); }
          to { opacity:1; transform: translateY(0); }
        }

        .cm-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.95rem; color: white;
          flex-shrink: 0;
        }

        .cm-avatar-sm {
          width: 30px; height: 30px;
          font-size: 0.78rem;
        }

        .cm-body { flex: 1; min-width: 0; }

        .cm-meta {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.3rem;
        }
        .cm-author { font-weight: 600; font-size: 0.85rem; color: var(--text-main); }
        .cm-time { font-size: 0.78rem; color: var(--text-muted); opacity: 0.6; }
        .cm-text {
          color: var(--text-muted);
          font-size: 0.93rem;
          line-height: 1.6;
          word-break: break-word;
          margin-bottom: 0.4rem;
        }

        .reply-trigger {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          transition: all 0.2s;
        }
        .reply-trigger:hover {
          color: var(--accent);
          border-color: rgba(236,72,153,0.3);
          background: rgba(236,72,153,0.08);
        }

        /* Replies */
        .replies-list {
          margin-top: 0.75rem;
          margin-left: 47px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .reply-row {
          display: flex;
          gap: 0.75rem;
          position: relative;
          animation: fadeIn 0.2s ease;
        }

        .reply-connector {
          position: absolute;
          left: -20px;
          top: 0;
          width: 12px;
          height: 18px;
          border-left: 2px solid var(--glass-border);
          border-bottom: 2px solid var(--glass-border);
          border-bottom-left-radius: 6px;
          pointer-events: none;
        }

        /* Reply Form */
        .reply-form-wrapper {
          margin-top: 0.75rem;
          margin-left: 47px;
        }

        .reply-form {
          background: rgba(109,40,217,0.04);
          border: 1px solid rgba(109,40,217,0.15);
          border-radius: 10px;
          padding: 0.9rem;
          animation: fadeIn 0.2s ease;
        }

        .reply-form-inner { display: flex; gap: 0.75rem; align-items: flex-start; }

        .rf-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.75rem; color: white;
          flex-shrink: 0; margin-top: 2px;
        }

        .rf-right { flex: 1; min-width: 0; }

        .rf-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 0.6rem 0.9rem;
          color: var(--text-main);
          font-size: 0.88rem;
          resize: none;
          transition: border-color 0.2s;
        }
        .rf-input:focus {
          outline: none;
          border-color: var(--primary);
        }
        .rf-input::placeholder { color: var(--text-muted); opacity: 0.6; }
        .rf-error { color: #f87171; font-size: 0.8rem; margin-top: 0.3rem; }

        .rf-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .rf-cancel {
          font-size: 0.82rem;
          color: var(--text-muted);
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          transition: all 0.2s;
        }
        .rf-cancel:hover { color: var(--text-main); }

        .rf-submit {
          font-size: 0.82rem;
          color: white;
          padding: 0.3rem 0.9rem;
          border-radius: 6px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          font-weight: 600;
          transition: all 0.2s;
        }
        .rf-submit:hover:not(:disabled) {
          box-shadow: 0 2px 10px rgba(109,40,217,0.4);
        }
        .rf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
