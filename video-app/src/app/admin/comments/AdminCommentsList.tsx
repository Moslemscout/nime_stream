'use client';

import { useState } from 'react';

interface ReplyItem {
  id: string;
  content: string;
  userEmail: string;
  approved: boolean;
  createdAt: Date;
  videoId: string;
  episodeId: string | null;
  parentId: string;
  video: { id: string; title: string };
}

interface CommentItem {
  id: string;
  content: string;
  userEmail: string;
  approved: boolean;
  createdAt: Date;
  videoId: string;
  episodeId: string | null;
  parentId: null;
  video: { id: string; title: string };
  replies: ReplyItem[];
}

interface Props {
  initialComments: CommentItem[];
  showVideoTag?: boolean;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
}

type FilterType = 'all' | 'approved' | 'hidden';

export default function AdminCommentsList({ initialComments, showVideoTag = true }: Props) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Stats across all comments + replies
  const allItems = [
    ...comments,
    ...comments.flatMap(c => c.replies),
  ];
  const totalApproved = allItems.filter(c => c.approved).length;
  const totalHidden = allItems.length - totalApproved;

  const handleToggle = async (id: string, approved: boolean, isReply = false, parentId?: string) => {
    setLoadingId(id);
    try {
      await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !approved }),
      });

      if (isReply && parentId) {
        setComments(prev =>
          prev.map(c =>
            c.id === parentId
              ? {
                  ...c,
                  replies: c.replies.map(r =>
                    r.id === id ? { ...r, approved: !approved } : r
                  ),
                }
              : c
          )
        );
      } else {
        setComments(prev =>
          prev.map(c => (c.id === id ? { ...c, approved: !approved } : c))
        );
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, isReply = false, parentId?: string) => {
    if (!confirm('Yakin ingin menghapus komentar ini?')) return;
    setLoadingId(id);
    try {
      await fetch(`/api/comments/${id}`, { method: 'DELETE' });

      if (isReply && parentId) {
        setComments(prev =>
          prev.map(c =>
            c.id === parentId
              ? { ...c, replies: c.replies.filter(r => r.id !== id) }
              : c
          )
        );
      } else {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } finally {
      setLoadingId(null);
    }
  };

  // Filter comments based on tab
  const filteredComments = comments.filter(c => {
    if (filter === 'approved') return c.approved;
    if (filter === 'hidden') return !c.approved;
    return true;
  });

  const ActionButtons = ({
    id, approved, isReply = false, parentId
  }: {
    id: string; approved: boolean; isReply?: boolean; parentId?: string;
  }) => (
    <div className="comment-actions">
      <span className={`status-badge ${approved ? 'status-visible' : 'status-hidden'}`}>
        {approved ? 'Tampil' : 'Tersembunyi'}
      </span>
      <button
        className={`action-btn ${approved ? 'btn-hide' : 'btn-show'}`}
        onClick={() => handleToggle(id, approved, isReply, parentId)}
        disabled={loadingId === id}
      >
        {loadingId === id ? '...' : approved ? 'Sembunyikan' : 'Tampilkan'}
      </button>
      <button
        className="action-btn btn-delete"
        onClick={() => handleDelete(id, isReply, parentId)}
        disabled={loadingId === id}
      >
        Hapus
      </button>
    </div>
  );

  return (
    <div className="comments-manager">
      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'approved', 'hidden'] as FilterType[]).map(tab => (
          <button
            key={tab}
            className={`filter-tab ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all'
              ? `Semua (${allItems.length})`
              : tab === 'approved'
              ? `✅ Tampil (${totalApproved})`
              : `🚫 Tersembunyi (${totalHidden})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {filteredComments.length === 0 ? (
        <div className="empty-state">Tidak ada komentar untuk filter ini.</div>
      ) : (
        <div className="comments-table">
          {filteredComments.map(comment => (
            <div key={comment.id} className="comment-thread">
              {/* Top-level comment */}
              <div className={`comment-row ${!comment.approved ? 'dim' : ''}`}>
                <div className="comment-left">
                  <div className="user-bubble">{comment.userEmail[0].toUpperCase()}</div>
                  <div className="comment-info">
                    <span className="comment-email">{comment.userEmail}</span>
                    <div className="comment-movie-ref">
                      {showVideoTag && (
                        <span className="movie-tag">📽 {comment.video.title}</span>
                      )}
                      <span className="time-tag">{timeAgo(comment.createdAt)}</span>
                      {comment.replies.length > 0 && (
                        <span className="reply-count-tag">
                          ↩ {comment.replies.length} balasan
                        </span>
                      )}
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                </div>
                <ActionButtons id={comment.id} approved={comment.approved} />
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="replies-section">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className={`reply-row ${!reply.approved ? 'dim' : ''}`}>
                      <div className="reply-connector" />
                      <div className="comment-left" style={{ flex: 1 }}>
                        <div className="user-bubble user-bubble-sm">
                          {reply.userEmail[0].toUpperCase()}
                        </div>
                        <div className="comment-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="comment-email">{reply.userEmail}</span>
                            <span className="reply-label">↩ balasan</span>
                          </div>
                          <div className="comment-movie-ref">
                            <span className="time-tag">{timeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="comment-content">{reply.content}</p>
                        </div>
                      </div>
                      <ActionButtons
                        id={reply.id}
                        approved={reply.approved}
                        isReply={true}
                        parentId={comment.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .comments-manager {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 0.5rem 1.25rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
          border: 1px solid var(--glass-border);
          transition: all 0.2s;
        }
        .filter-tab:hover { background: rgba(255,255,255,0.08); color: var(--text-main); }
        .filter-tab.active {
          background: rgba(109,40,217,0.2);
          color: #a78bfa;
          border-color: rgba(109,40,217,0.4);
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
          background: var(--surface);
          border-radius: 16px;
          border: 1px dashed var(--glass-border);
        }

        .comments-table { display: flex; flex-direction: column; gap: 0.75rem; }

        /* Thread = top comment + its replies */
        .comment-thread {
          background: var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s;
          animation: fadeIn 0.25s ease;
        }
        .comment-thread:hover { border-color: rgba(109,40,217,0.2); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .comment-row {
          padding: 1.1rem 1.25rem;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .dim { opacity: 0.45; background: rgba(255,255,255,0.01); }

        /* Replies section */
        .replies-section {
          border-top: 1px solid var(--glass-border);
          background: rgba(109,40,217,0.03);
        }

        .reply-row {
          padding: 0.85rem 1.25rem 0.85rem 2.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          border-top: 1px solid var(--glass-border);
          position: relative;
          transition: background 0.2s;
        }
        .reply-row:first-child { border-top: none; }
        .reply-row:hover { background: rgba(255,255,255,0.02); }

        .reply-connector {
          position: absolute;
          left: 26px;
          top: 0;
          width: 10px;
          height: 20px;
          border-left: 2px solid rgba(109,40,217,0.2);
          border-bottom: 2px solid rgba(109,40,217,0.2);
          border-bottom-left-radius: 5px;
        }

        /* Shared */
        .comment-left {
          display: flex;
          gap: 0.85rem;
          flex: 1;
          min-width: 0;
        }

        .user-bubble {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; color: white;
          flex-shrink: 0;
        }

        .user-bubble-sm {
          width: 28px; height: 28px;
          font-size: 0.75rem;
        }

        .comment-info { flex: 1; min-width: 0; }

        .comment-email {
          font-weight: 600;
          font-size: 0.88rem;
          color: var(--text-main);
          display: block;
          margin-bottom: 0.2rem;
        }

        .comment-movie-ref {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
          flex-wrap: wrap;
        }

        .movie-tag {
          font-size: 0.75rem;
          color: var(--accent);
          background: rgba(236,72,153,0.1);
          padding: 2px 8px;
          border-radius: 999px;
        }

        .time-tag { font-size: 0.75rem; color: var(--text-muted); opacity: 0.6; }

        .reply-count-tag {
          font-size: 0.74rem;
          color: #a78bfa;
          background: rgba(109,40,217,0.1);
          padding: 2px 7px;
          border-radius: 999px;
        }

        .reply-label {
          font-size: 0.72rem;
          color: #a78bfa;
          background: rgba(109,40,217,0.1);
          padding: 1px 6px;
          border-radius: 999px;
        }

        .comment-content {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
          word-break: break-word;
        }

        /* Action buttons */
        .comment-actions {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .status-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .status-visible {
          background: rgba(74,222,128,0.1);
          color: #4ade80;
          border: 1px solid rgba(74,222,128,0.2);
        }
        .status-hidden {
          background: rgba(248,113,113,0.1);
          color: #f87171;
          border: 1px solid rgba(248,113,113,0.2);
        }

        .action-btn {
          padding: 0.35rem 0.85rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-hide {
          background: rgba(251,191,36,0.1);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.2);
        }
        .btn-hide:hover:not(:disabled) { background: rgba(251,191,36,0.2); }

        .btn-show {
          background: rgba(74,222,128,0.1);
          color: #4ade80;
          border: 1px solid rgba(74,222,128,0.2);
        }
        .btn-show:hover:not(:disabled) { background: rgba(74,222,128,0.2); }

        .btn-delete {
          background: rgba(248,113,113,0.1);
          color: #f87171;
          border: 1px solid rgba(248,113,113,0.2);
        }
        .btn-delete:hover:not(:disabled) { background: rgba(248,113,113,0.2); }
      `}</style>
    </div>
  );
}
