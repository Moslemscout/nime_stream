import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0; // Dynamic rendering

export default async function Home({ searchParams }: { searchParams: { category?: string } }) {
  const { category } = await searchParams;

  const videos = await prisma.video.findMany({
    where: category ? {
      categories: {
        contains: category
      }
    } : {},
    include: {
      episodes: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const categories = ["All", "Action", "Adventure", "Comedy", "Drama", "Sci-Fi", "Fantasy", "Horror", "Mystery", "Romance"];

  return (
    <div className="home-container">
      <header className="hero">
        <h1 className="hero-title">Watch Video <span>Enjoy.</span></h1>
        <p className="hero-subtitle">Free to watch, and no ads</p>
      </header>

      <div className="category-nav">
        {categories.map(cat => (
          <Link
            key={cat}
            href={cat === "All" ? "/" : `/?category=${cat}`}
            className={`cat-link ${(category === cat || (!category && cat === "All")) ? 'active' : ''}`}
          >
            {cat}
          </Link>
        ))}
      </div>

      <section className="video-grid-section">
        <div className="section-header">
          <h2 className="section-title">{category || "Latest"} Releases</h2>
          <span className="count-badge">{videos.length} videos</span>
        </div>

        {videos.length === 0 ? (
          <div className="empty-state">
            <p>No videos found in this category.</p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map(video => {
              const formattedThumb = video.thumbnail.includes('drive.google.com')
                ? video.thumbnail.replace(/\/file\/d\/(.+?)\/(view|edit).*/, '/thumbnail?id=$1&sz=w1000')
                : video.thumbnail.includes('?id=')
                  ? video.thumbnail.replace('uc?export=download&id=', 'thumbnail?id=') + '&sz=w1000'
                  : video.thumbnail;

              return (
                <Link href={`/watch/${video.id}`} key={video.id} className="video-card">
                  <div className="video-thumbnail">
                    <img src={formattedThumb} alt={video.title} />
                    <div className="category-tags-container">
                      {video.categories.split(', ').map(cat => (
                        <span key={cat} className="category-tag">{cat}</span>
                      ))}
                    </div>
                    <div className="play-overlay">
                      <div className="play-button">▶</div>
                    </div>
                  </div>
                  <div className="video-info">
                    <h3 className="video-title">{video.title}</h3>
                    <p className="video-desc">{video.description.substring(0, 80)}{video.description.length > 80 ? '...' : ''}</p>
                    <p className="series-ep-count">{video.episodes.length} Episodes</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        .home-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .hero {
          text-align: center;
          padding: 6rem 0;
          margin-bottom: 2rem;
        }
        
        .hero-title {
          font-size: 2rem;
          margin-bottom: 1rem;
          line-height: 0.8;
        }
        
        .hero-title span {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-muted);
          max-width: 600px;
          margin: 0 auto;
        }
        
        .category-nav {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 4rem;
          flex-wrap: wrap;
        }

        .cat-link {
          padding: 0.6rem 1.5rem;
          background: var(--surface);
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          font-weight: 500;
          color: var(--text-muted);
          transition: all 0.3s ease;
        }

        .cat-link:hover {
          border-color: var(--primary);
          color: var(--text-main);
        }

        .cat-link.active {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(109, 40, 217, 0.3);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .count-badge {
          font-size: 0.85rem;
          color: var(--text-muted);
          background: var(--surface);
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid var(--glass-border);
        }

        .section-title {
          font-size: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .section-title::before {
          content: "";
          display: block;
          width: 24px;
          height: 4px;
          background: var(--primary);
          border-radius: 2px;
        }

        .category-tags-container {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          z-index: 10;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          max-width: 90%;
        }

        .category-tag {
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--accent);
          border: 1px solid var(--glass-border);
          text-transform: uppercase;
          pointer-events: none;
        }
        
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .video-card {
          background: var(--surface);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--glass-border);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          display: flex;
          flex-direction: column;
        }
        
        .video-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow);
          border-color: rgba(109, 40, 217, 0.3);
        }
        
        .video-thumbnail {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
        }
        
        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        
        .video-card:hover .video-thumbnail img {
          transform: scale(1.05);
        }
        
        .play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .video-card:hover .play-overlay {
          opacity: 1;
        }
        
        .play-button {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          padding-left: 5px;
          border: 1px solid rgba(255,255,255,0.4);
          transform: scale(0.8);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .video-card:hover .play-button {
          transform: scale(1);
        }
        
        .video-info {
          padding: 1.5rem;
          flex-grow: 1;
        }
        
        .video-title {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          color: var(--text-main);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .video-desc {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }

        .series-ep-count {
          font-size: 0.8rem;
          color: var(--accent);
          font-weight: 600;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem;
          background: var(--surface);
          border-radius: 16px;
          border: 1px dashed var(--glass-border);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
