import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { addEpisode, deleteEpisode } from '../../actions';
import Link from 'next/link';

export default async function ManageEpisodesPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      episodes: {
        orderBy: { number: 'asc' }
      }
    }
  });

  if (!video) {
    notFound();
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <Link href="/admin" className="back-link">← Back to Dashboard</Link>
        <div className="series-context">
          <img src={video.thumbnail} alt={video.title} className="context-thumb" />
          <div className="context-info">
            <h1>Manage Episodes</h1>
            <p className="series-name">{video.title}</p>
            <p className="series-desc-short">{video.description.substring(0, 150)}...</p>
          </div>
        </div>
      </div>

      <div className="episodes-content">
        <div className="add-episode-section">
          <h2>Add New Episode</h2>
          <form action={async (formData) => {
            'use server'
            await addEpisode(video.id, formData);
          }} className="glass-form">
            <div className="form-row">
              <div className="form-group" style={{ flex: '0 0 100px' }}>
                <label>Number</label>
                <input type="number" name="number" required defaultValue={video.episodes.length + 1} />
              </div>
              <div className="form-group flex-1">
                <label>Title Episodes</label>
                <input type="text" name="title" placeholder="Episode title" />
              </div>
            </div>

            <div className="form-group">
              <label>Video URLs</label>
              <div className="url-inputs">
                <input type="url" name="url480" placeholder="480p URL (Drive/Direct)" />
                <input type="url" name="url720" placeholder="720p URL (Drive/Direct)" />
                <input type="url" name="url1080" placeholder="1080p URL (Drive/Direct)" />
              </div>
            </div>

            <button type="submit" className="submit-btn">+ Add Episode</button>
          </form>
        </div>

        <div className="current-episodes-section">
          <h2>Current Episodes ({video.episodes.length})</h2>
          <div className="ep-list">
            {video.episodes.length === 0 ? (
              <p className="text-muted">No episodes added yet.</p>
            ) : (
              video.episodes.map(ep => (
                <div key={ep.id} className="ep-card">
                  <div className="ep-info">
                    <span className="ep-num">#{ep.number}</span>
                    <span className="ep-title">{ep.title || `Episode ${ep.number}`}</span>
                  </div>
                  <div className="ep-qualities">
                    {ep.url480 && <span className="q-tag">480p</span>}
                    {ep.url720 && <span className="q-tag">720p</span>}
                    {ep.url1080 && <span className="q-tag">1080p</span>}
                  </div>
                  <form action={async () => {
                    'use server'
                    await deleteEpisode(ep.id)
                  }}>
                    <button type="submit" className="del-btn">Remove</button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .admin-header { margin-bottom: 3rem; }
        .back-link { color: var(--text-muted); margin-bottom: 1.5rem; display: block; font-size: 0.9rem; }
        
        .series-context {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          padding: 1.5rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }
        
        .context-thumb {
          width: 120px;
          aspect-ratio: 16/9;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .series-name {
          font-size: 1.2rem;
          color: var(--accent);
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .series-desc-short {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 600px;
        }

        h1 { font-size: 2rem; background: linear-gradient(to right, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .episodes-content { display: grid; grid-template-columns: 1fr; gap: 3rem; }
        @media (min-width: 1024px) { .episodes-content { grid-template-columns: 1fr 1fr; } }

        h2 { margin-bottom: 1.5rem; font-size: 1.4rem; }

        .glass-form { background: var(--surface); padding: 2rem; border-radius: 16px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: flex; gap: 1rem; }
        .flex-1 { flex: 1; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .url-inputs { display: flex; flex-direction: column; gap: 0.75rem; }
        
        input { padding: 0.75rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; }
        
        .submit-btn { padding: 1rem; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-weight: 600; }

        .ep-list { display: flex; flex-direction: column; gap: 1rem; }
        .ep-card { background: var(--surface); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 1.5rem; }
        .ep-info { flex-grow: 1; display: flex; align-items: center; gap: 1rem; }
        .ep-num { font-weight: 700; color: var(--accent); font-size: 1.2rem; }
        .ep-title { color: var(--text-main); font-weight: 500; }
        
        .ep-qualities { display: flex; gap: 0.4rem; }
        .q-tag { font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; color: var(--text-muted); }
        
        .del-btn { color: #ef4444; font-size: 0.9rem; font-weight: 500; }
      `}</style>
    </div>
  );
}
