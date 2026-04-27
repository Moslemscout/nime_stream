import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { addVideo, deleteVideo } from './actions';
import { cookies } from 'next/headers';
import AdminLoginForm from './AdminLoginForm';
import AdminLogoutBtn from './AdminLogoutBtn';

export const revalidate = 0;

export default async function AdminPage() {
  // ── Auth check ────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const isAuth = token === process.env.ADMIN_SESSION_SECRET;

  if (!isAuth) {
    return <AdminLoginForm />;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const videos = await prisma.video.findMany({
    include: {
      episodes: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  const categories = ["Action", "Adventure", "Comedy", "Drama", "Sci-Fi", "Fantasy", "Horror", "Mystery", "Romance"];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-top">
          <div>
            <div className="admin-badge">🔐 Administrator</div>
            <h1>Admin Dashboard</h1>
            <p>Manage your video</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin/comments" className="comments-admin-btn">
              Semua Komentar
            </Link>
            <AdminLogoutBtn />
          </div>
        </div>
        <div className="admin-tip">
          <strong>Tip:</strong> use Google Drive "Share" links!
        </div>
      </div>

      <div className="admin-content">
        <div className="add-video-section">
          <h2>Add New Series</h2>
          <form action={addVideo} className="glass-form">
            <div className="form-group">
              <label htmlFor="title">Series Title</label>
              <input type="text" id="title" name="title" required placeholder="Series title" />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" required rows={4} placeholder="Series description"></textarea>
            </div>

            <div className="form-group">
              <label>Categories</label>
              <div className="category-checkboxes">
                {categories.map(cat => (
                  <label key={cat} className="checkbox-label">
                    <input type="checkbox" name="categories" value={cat} />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="thumbnail">Thumbnail URL</label>
              <input type="url" id="thumbnail" name="thumbnail" required placeholder="https://example.com/thumb.jpg" />
            </div>

            <button type="submit" className="submit-btn">+ Create Series</button>
          </form>
        </div>

        <div className="manage-videos-section">
          <h2>Manage Catalog</h2>
          <div className="video-list">
            {videos.length === 0 ? (
              <p className="text-muted">No series found.</p>
            ) : (
              videos.map(video => (
                <div key={video.id} className="admin-video-card">
                  <img src={video.thumbnail} alt={video.title} className="admin-thumb" />
                  <div className="admin-video-info">
                    <div className="title-row">
                      <h3>{video.title}</h3>
                      <div className="cat-badge-container">
                        {video.categories.split(', ').map(cat => (
                          <span key={cat} className="cat-badge" style={{ fontSize: '0.55rem' }}>{cat}</span>
                        ))}
                      </div>
                    </div>
                    <div className="series-meta">
                      <span>{video.episodes.length} Episodes</span>
                      {video.episodes.length === 0 && (
                        <p className="no-episodes-warning">Click "Episodes" to upload video quality!</p>
                      )}
                    </div>
                  </div>
                  <div className="admin-actions">
                    <Link href={`/admin/episodes/${video.id}`} className="manage-btn">Episodes</Link>
                    <Link href={`/admin/edit/${video.id}`} className="edit-btn">Edit</Link>
                    <Link href={`/admin/comments/${video.id}`} className="comments-btn">
                      Komentar
                      {video._count.comments > 0 && (
                        <span className="comment-count-badge">{video._count.comments}</span>
                      )}
                    </Link>
                    <form action={async () => {
                      'use server'
                      await deleteVideo(video.id)
                    }}>
                      <button type="submit" className="delete-btn">Delete</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .admin-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header {
          margin-bottom: 3rem;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 1.5rem;
        }

        .admin-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .comments-admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(109, 40, 217, 0.15);
          border: 1px solid rgba(109, 40, 217, 0.3);
          color: #a78bfa;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .comments-admin-btn:hover {
          background: rgba(109, 40, 217, 0.25);
          border-color: rgba(109, 40, 217, 0.5);
          transform: translateY(-1px);
        }

        .admin-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .admin-tip {
          margin-top: 1rem;
          background: rgba(109, 40, 217, 0.1);
          border: 1px solid rgba(109, 40, 217, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: #a78bfa;
          font-size: 0.9rem;
          display: inline-block;
        }

        .admin-tip strong {
          color: white;
          margin-right: 0.5rem;
        }

        .admin-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        @media (min-width: 1024px) {
          .admin-content {
            grid-template-columns: 1fr 1fr;
          }
        }

        h2 { font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--text-main); }

        .glass-form {
          background: var(--surface);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        
        .category-checkboxes {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.5rem;
          background: rgba(255,255,255,0.03);
          padding: 1rem;
          border-radius: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        label { font-weight: 500; color: var(--text-muted); font-size: 0.9rem; }

        input, textarea {
          padding: 0.75rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
        }

        .submit-btn {
          padding: 1rem;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          font-weight: 600;
        }

        .video-list { display: flex; flex-direction: column; gap: 1rem; }

        .admin-video-card {
          background: var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .admin-thumb { width: 70px; height: 40px; object-fit: cover; border-radius: 6px; }

        .admin-video-info { flex-grow: 1; }
        .admin-video-info h3 { font-size: 1rem; margin-bottom: 0.2rem; }
        
        .title-row { display: flex; flex-direction: column; gap: 0.3rem; }
        .cat-badge-container { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .cat-badge {
          background: rgba(109, 40, 217, 0.2);
          color: var(--accent);
          padding: 1px 6px;
          border-radius: 999px;
          font-weight: 700;
        }
        
        .series-meta { font-size: 0.8rem; color: var(--text-muted); }
        .no-episodes-warning { color: var(--accent); font-size: 0.75rem; font-weight: 600; margin-top: 0.2rem; }

        .admin-actions { display: flex; gap: 0.5rem; align-items: center; }
        
        .edit-btn, .manage-btn {
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .edit-btn { background: rgba(109, 40, 217, 0.1); color: #a78bfa; border: 1px solid rgba(109, 40, 217, 0.2); }
        .manage-btn { background: rgba(236, 72, 153, 0.1); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.2); }
        .comments-btn {
          background: rgba(20, 184, 166, 0.1);
          color: #2dd4bf;
          border: 1px solid rgba(20, 184, 166, 0.25);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
        }
        .comments-btn:hover {
          background: rgba(20, 184, 166, 0.2);
          border-color: rgba(20, 184, 166, 0.5);
        }
        .comment-count-badge {
          background: rgba(20, 184, 166, 0.25);
          color: #2dd4bf;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 999px;
          line-height: 1.4;
        }
        .delete-btn { color: #ef4444; font-size: 0.85rem; padding: 0.4rem 0.8rem; }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a78bfa;
          background: rgba(109, 40, 217, 0.12);
          border: 1px solid rgba(109, 40, 217, 0.25);
          padding: 3px 10px;
          border-radius: 999px;
          margin-bottom: 0.4rem;
        }

        .admin-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .admin-logout-btn {
          background: rgba(248, 113, 113, 0.08);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
          padding: 0.45rem 1rem;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .admin-logout-btn:hover {
          background: rgba(248, 113, 113, 0.16);
          border-color: rgba(248, 113, 113, 0.4);
        }
      `}</style>
    </div>
  );
}
