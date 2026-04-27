import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AdminCommentsList from '../AdminCommentsList';

export const revalidate = 0;

export default async function VideoCommentsPage({
  params,
}: {
  params: { videoId: string };
}) {
  const { videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      comments: {
        where: { parentId: null }, // top-level only
        orderBy: { createdAt: 'desc' },
        include: {
          video: { select: { id: true, title: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              video: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!video) notFound();

  const allComments = video.comments;
  const allReplies = allComments.flatMap(c => c.replies);
  const totalAll = allComments.length + allReplies.length;
  const approvedCount = [...allComments, ...allReplies].filter(c => c.approved).length;
  const hiddenCount = totalAll - approvedCount;

  return (
    <div className="vc-container">
      {/* Header */}
      <div className="vc-header">
        <Link href="/admin/comments" className="back-link">
          ← Kembali ke daftar video
        </Link>

        <div className="vc-header-row">
          <div className="vc-title-block">
            <img src={video.thumbnail} alt={video.title} className="vc-thumb" />
            <div>
              <h1>{video.title}</h1>
              <Link href={`/watch/${video.id}`} className="watch-link" target="_blank">
                ↗ Lihat video
              </Link>
            </div>
          </div>

          <div className="vc-stats">
            <div className="stat-chip">
              <span className="stat-num">{totalAll}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-chip stat-green">
              <span className="stat-num">{approvedCount}</span>
              <span className="stat-label">Tampil</span>
            </div>
            <div className="stat-chip stat-red">
              <span className="stat-num">{hiddenCount}</span>
              <span className="stat-label">Tersembunyi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <AdminCommentsList initialComments={video.comments} showVideoTag={false} />

      <style>{`
        .vc-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }

        .vc-header {
          margin-bottom: 2rem;
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

        .vc-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          background: var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .vc-title-block {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }

        .vc-thumb {
          width: 100px;
          height: 58px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
        }

        h1 {
          font-size: 1.4rem;
          color: var(--text-main);
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 400px;
          background: none;
          -webkit-text-fill-color: var(--text-main);
        }

        .watch-link {
          color: var(--accent);
          font-size: 0.82rem;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }
        .watch-link:hover { opacity: 0.7; }

        .vc-stats {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .stat-chip {
          background: rgba(109, 40, 217, 0.12);
          border: 1px solid rgba(109, 40, 217, 0.25);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          text-align: center;
          min-width: 65px;
        }

        .stat-chip.stat-green {
          background: rgba(74, 222, 128, 0.08);
          border-color: rgba(74, 222, 128, 0.2);
        }

        .stat-chip.stat-red {
          background: rgba(248, 113, 113, 0.08);
          border-color: rgba(248, 113, 113, 0.2);
        }

        .stat-num {
          display: block;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
