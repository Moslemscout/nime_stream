import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminCommentsPage() {
  // Get all videos with their comment counts
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { comments: true },
      },
      comments: {
        select: {
          approved: true,
          replies: { select: { approved: true } },
        },
      },
    },
  });

  const totalComments = videos.reduce((sum, v) => {
    const replies = v.comments.flatMap(c => c.replies ?? []);
    return sum + v._count.comments + replies.length;
  }, 0);
  const totalHidden = videos.reduce((sum, v) => {
    const replies = v.comments.flatMap(c => c.replies ?? []);
    const hiddenParents = v.comments.filter(c => !c.approved).length;
    const hiddenReplies = replies.filter(r => !r.approved).length;
    return sum + hiddenParents + hiddenReplies;
  }, 0);

  return (
    <div className="ac-container">
      {/* Header */}
      <div className="ac-header">
        <Link href="/admin" className="back-link">← Back to Dashboard</Link>
        <div className="ac-header-row">
          <div>
            <h1>Komentar</h1>
            <p className="ac-subtitle">Pilih video untuk moderasi komentar</p>
          </div>
          <div className="ac-stats">
            <div className="stat-chip">
              <span className="stat-num">{totalComments}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-chip stat-warn">
              <span className="stat-num">{totalHidden}</span>
              <span className="stat-label">Disembunyikan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video List */}
      {videos.length === 0 ? (
        <div className="empty-state">
          <span>Belum ada video di katalog.</span>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(video => {
            const hidden = video.comments.filter(c => !c.approved).length;
            const visible = video._count.comments - hidden;
            return (
              <Link
                key={video.id}
                href={`/admin/comments/${video.id}`}
                className="video-card"
              >
                <img src={video.thumbnail} alt={video.title} className="video-thumb" />
                <div className="video-card-body">
                  <h3 className="video-card-title">{video.title}</h3>
                  <div className="comment-badges">
                    <span className="badge badge-total">
                      💬 {video._count.comments} komentar
                    </span>
                    {hidden > 0 && (
                      <span className="badge badge-hidden">
                        🚫 {hidden} tersembunyi
                      </span>
                    )}
                    {visible > 0 && (
                      <span className="badge badge-visible">
                        ✅ {visible} tampil
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-arrow">→</div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .ac-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }

        .back-link {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s ease;
          display: inline-block;
          margin-bottom: 1.25rem;
        }
        .back-link:hover { color: var(--accent); }

        .ac-header {
          margin-bottom: 2.5rem;
        }

        .ac-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        h1 {
          font-size: 2rem;
          background: linear-gradient(to right, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.25rem;
        }

        .ac-subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .ac-stats {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .stat-chip {
          background: rgba(109, 40, 217, 0.12);
          border: 1px solid rgba(109, 40, 217, 0.25);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          text-align: center;
          min-width: 70px;
        }

        .stat-chip.stat-warn {
          background: rgba(248, 113, 113, 0.1);
          border-color: rgba(248, 113, 113, 0.25);
        }

        .stat-num {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .empty-state {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
          background: var(--surface);
          border-radius: 16px;
          border: 1px dashed var(--glass-border);
        }

        .video-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .video-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 1rem 1.25rem;
          transition: all 0.2s ease;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .video-card:hover {
          border-color: rgba(109, 40, 217, 0.4);
          background: rgba(109, 40, 217, 0.05);
          transform: translateX(4px);
        }

        .video-thumb {
          width: 80px;
          height: 46px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          background: var(--surface-hover);
        }

        .video-card-body {
          flex: 1;
          min-width: 0;
        }

        .video-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 0.4rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .comment-badges {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .badge-total {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text-muted);
          border: 1px solid var(--glass-border);
        }

        .badge-hidden {
          background: rgba(248, 113, 113, 0.1);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
        }

        .badge-visible {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.2);
        }

        .card-arrow {
          color: var(--text-muted);
          font-size: 1.1rem;
          flex-shrink: 0;
          opacity: 0.5;
          transition: all 0.2s ease;
        }

        .video-card:hover .card-arrow {
          opacity: 1;
          color: var(--accent);
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
