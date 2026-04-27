import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import CommentSection from '@/components/CommentSection';

export default async function WatchPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }, 
  searchParams: { ep?: string } 
}) {
  const { id } = await params;
  const { ep } = await searchParams;
  
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

  const currentEpNumber = ep ? parseInt(ep) : 1;
  const currentEpisode = video.episodes.find(e => e.number === currentEpNumber) || video.episodes[0];

  return (
    <div className="watch-container">
      <Link href="/dashboard" className="back-link">
        ← Back to Browse
      </Link>
      
      <div className="watch-layout">
        <div className="player-col">
          {currentEpisode ? (
            <>
              <VideoPlayer 
                url480={currentEpisode.url480}
                url720={currentEpisode.url720}
                url1080={currentEpisode.url1080}
                thumbnail={video.thumbnail}
              />
              <div className="video-details">
                <h1 className="watch-title">{video.title}</h1>
                <h2 className="episode-subtitle">Episode {currentEpisode.number}: {currentEpisode.title || 'Untitled'}</h2>
                <div className="video-meta">
                  <span>Added on {new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="video-description-box">
                  <p>{video.description}</p>
                </div>
              </div>

              {/* Comment Section */}
              <CommentSection videoId={video.id} episodeId={currentEpisode.id} />
            </>
          ) : (
            <div className="empty-player">
              <p>No episodes available yet for this series.</p>
            </div>
          )}
        </div>

        <div className="episodes-col">
          <div className="ep-sidebar">
            <h3>Episodes</h3>
            <div className="ep-list">
              {video.episodes.map(episode => (
                <Link 
                  key={episode.id} 
                  href={`/watch/${video.id}?ep=${episode.number}`}
                  className={`ep-link ${currentEpisode?.id === episode.id ? 'active' : ''}`}
                >
                  <span className="ep-num">{episode.number}</span>
                  <span className="ep-name truncate">{episode.title || `Episode ${episode.number}`}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .watch-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 2rem;
          color: var(--text-muted);
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: var(--accent);
        }

        .watch-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .watch-layout {
            grid-template-columns: 1fr 350px;
          }
        }

        .player-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .video-details {
          background: var(--surface);
          padding: 2.5rem;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
        }

        .watch-title {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: var(--text-main);
        }

        .episode-subtitle {
          font-size: 1.2rem;
          color: var(--accent);
          margin-bottom: 1rem;
        }

        .video-meta {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .video-description-box p {
          line-height: 1.8;
          color: var(--text-muted);
          font-size: 1.1rem;
          white-space: pre-wrap;
        }

        .episodes-col {
          display: flex;
          flex-direction: column;
        }

        .ep-sidebar {
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .ep-sidebar h3 {
          margin-bottom: 1.5rem;
          font-size: 1.3rem;
          color: var(--text-main);
        }

        .ep-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .ep-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .ep-link:hover {
          background: rgba(255,255,255,0.06);
          border-color: var(--glass-border);
        }

        .ep-link.active {
          background: rgba(109, 40, 217, 0.1);
          border-color: var(--primary);
        }

        .ep-num {
          font-weight: 700;
          color: var(--accent);
          min-width: 20px;
        }

        .ep-name {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .ep-link.active .ep-name {
          color: var(--text-main);
          font-weight: 500;
        }

        .empty-player {
          aspect-ratio: 16/9;
          background: var(--surface);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border: 1px dashed var(--glass-border);
        }

        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
