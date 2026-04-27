'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddToWatchlistModal from './AddToWatchlistModal';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  categories: string;
  episodes: { id: string }[];
}

interface WatchlistItem { videoId: string; listName: string; }

const CATEGORIES = ["All", "Action", "Adventure", "Comedy", "Drama", "Sci-Fi", "Fantasy", "Horror", "Mystery", "Romance"];

function formatThumb(thumbnail: string) {
  if (thumbnail.includes('drive.google.com'))
    return thumbnail.replace(/\/file\/d\/(.+?)\/(view|edit).*/, '/thumbnail?id=$1&sz=w1000');
  if (thumbnail.includes('?id='))
    return thumbnail.replace('uc?export=download&id=', 'thumbnail?id=') + '&sz=w1000';
  return thumbnail;
}

export default function DashboardClient({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
  const [activeList, setActiveList] = useState<string>('__all__'); // watchlist sub-filter

  // Watchlist data
  const [wlItems, setWlItems] = useState<WatchlistItem[]>([]);  // { videoId, listName }[]
  const [wlLists, setWlLists] = useState<string[]>([]);          // unique list names

  // Modal state
  const [modalVideoId, setModalVideoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const modalVideo = videos.find(v => v.id === modalVideoId) ?? null;

  useEffect(() => {
    const stored = localStorage.getItem('user_email');
    if (!stored) { router.push('/'); return; }
    setEmail(stored);

    const onLogin = (e: Event) => setEmail((e as CustomEvent).detail);
    const onLogout = () => router.push('/');
    window.addEventListener('user-login', onLogin);
    window.addEventListener('user-logout', onLogout);

    fetchWatchlist(stored).finally(() => setLoading(false));

    return () => {
      window.removeEventListener('user-login', onLogin);
      window.removeEventListener('user-logout', onLogout);
    };
  }, []);

  const fetchWatchlist = async (em: string) => {
    try {
      const res = await fetch(`/api/watchlist?email=${encodeURIComponent(em)}`);
      const data = await res.json();
      setWlItems(data.items ?? []);
      setWlLists(data.lists ?? []);
    } catch { /* silent */ }
  };

  // Save to a named list
  const handleSave = async (listName: string) => {
    if (!email || !modalVideoId || saving) return;
    setSaving(true);
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, videoId: modalVideoId, listName }),
      });
      await fetchWatchlist(email);
    } finally { setSaving(false); }
  };

  // Remove from a named list
  const handleRemove = async (listName: string) => {
    if (!email || !modalVideoId || saving) return;
    setSaving(true);
    try {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, videoId: modalVideoId, listName }),
      });
      await fetchWatchlist(email);
    } finally { setSaving(false); }
  };

  // ── Derived state ──
  // Set of videoIds saved in ANY list
  const savedVideoIds = useMemo(() => new Set(wlItems.map(i => i.videoId)), [wlItems]);

  // Lists current modal video is saved in
  const modalSavedInLists = useMemo(
    () => wlItems.filter(i => i.videoId === modalVideoId).map(i => i.listName),
    [wlItems, modalVideoId]
  );

  // Filtered videos
  const filteredVideos = useMemo(() => {
    let list = videos;

    if (activeTab === 'watchlist') {
      if (activeList !== '__all__') {
        const ids = new Set(wlItems.filter(i => i.listName === activeList).map(i => i.videoId));
        list = list.filter(v => ids.has(v.id));
      } else {
        list = list.filter(v => savedVideoIds.has(v.id));
      }
    }
    if (activeCategory !== 'All') {
      list = list.filter(v => v.categories.includes(activeCategory));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(v => v.title.toLowerCase().includes(q));
    }
    return list;
  }, [videos, activeTab, activeList, activeCategory, search, wlItems, savedVideoIds]);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Memuat...</p>
        <style>{loadingStyle}</style>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* ── Modal ── */}
      {modalVideo && (
        <AddToWatchlistModal
          videoId={modalVideo.id}
          videoTitle={modalVideo.title}
          email={email!}
          existingLists={wlLists}
          savedInLists={modalSavedInLists}
          onClose={() => setModalVideoId(null)}
          onSave={handleSave}
          onRemove={handleRemove}
        />
      )}

      {/* ── Hero + Search ── */}
      <header className="hero">
        <h1 className="hero-title">Watch Video <span>Enjoy.</span></h1>
        <p className="hero-subtitle">Free to watch, and no ads</p>
        <div className="search-bar">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul video..."
            className="search-input"
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="dash-tabs">
        <button
          className={`dash-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveTab('all'); setActiveList('__all__'); }}
        >
          🎬 Semua Video
        </button>
        <button
          className={`dash-tab ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          🔖 Watchlist
          {savedVideoIds.size > 0 && (
            <span className="tab-badge">{savedVideoIds.size}</span>
          )}
        </button>
      </div>

      {/* ── Watchlist sub-filter (only in watchlist tab) ── */}
      {activeTab === 'watchlist' && wlLists.length > 0 && (
        <div className="wl-list-filter">
          <button
            className={`wl-filter-chip ${activeList === '__all__' ? 'active' : ''}`}
            onClick={() => setActiveList('__all__')}
          >
            Semua ({savedVideoIds.size})
          </button>
          {wlLists.map(name => {
            const count = wlItems.filter(i => i.listName === name).length;
            return (
              <button
                key={name}
                className={`wl-filter-chip ${activeList === name ? 'active' : ''}`}
                onClick={() => setActiveList(name)}
              >
                📋 {name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Category Filter ── */}
      <div className="category-nav">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`cat-link ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Video Grid ── */}
      <section className="video-grid-section">
        <div className="section-header">
          <h2 className="section-title">
            {activeTab === 'watchlist'
              ? (activeList === '__all__' ? 'Watchlist' : activeList)
              : (activeCategory === 'All' ? 'Latest' : activeCategory) + ' Releases'}
          </h2>
          <span className="count-badge">{filteredVideos.length} video</span>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'watchlist' ? (
              <>
                <div className="empty-icon">🔖</div>
                <p>
                  {activeList !== '__all__'
                    ? `List "${activeList}" masih kosong.`
                    : 'Belum ada video di watchlist.'}
                </p>
                <p className="empty-hint">Klik ikon 🏷️ pada video untuk menyimpannya.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🎬</div>
                <p>Tidak ada video{search ? ` untuk "${search}"` : ''}.</p>
              </>
            )}
          </div>
        ) : (
          <div className="video-grid">
            {filteredVideos.map(video => {
              const thumb = formatThumb(video.thumbnail);
              const isSaved = savedVideoIds.has(video.id);

              return (
                <div key={video.id} className="video-card-wrapper">
                  <Link href={`/watch/${video.id}`} className="video-card">
                    <div className="video-thumbnail">
                      <img src={thumb} alt={video.title} />
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
                      <p className="video-desc">
                        {video.description.substring(0, 80)}{video.description.length > 80 ? '...' : ''}
                      </p>
                      <p className="series-ep-count">{video.episodes.length} Episodes</p>
                    </div>
                  </Link>

                  {/* Bookmark Button → opens modal */}
                  <button
                    className={`bookmark-btn ${isSaved ? 'saved' : ''}`}
                    onClick={e => { e.preventDefault(); setModalVideoId(video.id); }}
                    title={isSaved ? 'Kelola Watchlist' : 'Simpan ke Watchlist'}
                  >
                    {isSaved ? '🔖' : '🏷️'}
                  </button>

                  {/* Saved-in pills */}
                  {isSaved && (
                    <div className="saved-lists-pills">
                      {wlItems
                        .filter(i => i.videoId === video.id)
                        .slice(0, 2)
                        .map(i => (
                          <span key={i.listName} className="saved-pill">{i.listName}</span>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <style>{styles}</style>
    </div>
  );
}

const loadingStyle = `
  .dash-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: var(--text-muted); }
  .dash-spinner { width: 40px; height: 40px; border: 3px solid rgba(109,40,217,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const styles = `
  .home-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }

  .hero { text-align: center; padding: 4rem 0 2rem; margin-bottom: 1.5rem; }
  .hero-title { font-size: 2rem; margin-bottom: 0.75rem; line-height: 1; }
  .hero-title span { background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-subtitle { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2rem; }

  .search-bar { display: flex; align-items: center; gap: 0.75rem; max-width: 520px; margin: 0 auto; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 999px; padding: 0.6rem 1rem 0.6rem 1.25rem; transition: border-color 0.2s, box-shadow 0.2s; }
  .search-bar:focus-within { border-color: rgba(109,40,217,0.5); box-shadow: 0 0 0 3px rgba(109,40,217,0.08); }
  .search-input { flex: 1; background: transparent; border: none; color: var(--text-main); font-size: 0.95rem; outline: none; }
  .search-input::placeholder { color: var(--text-muted); opacity: 0.6; }
  .search-clear { color: var(--text-muted); font-size: 0.8rem; padding: 2px 6px; border-radius: 50%; transition: all 0.2s; background: rgba(255,255,255,0.06); }
  .search-clear:hover { color: var(--text-main); background: rgba(255,255,255,0.12); }

  .dash-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); }
  .dash-tab { display: flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.25rem; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
  .dash-tab:hover { color: var(--text-main); }
  .dash-tab.active { color: var(--text-main); border-bottom-color: var(--primary); }
  .tab-badge { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-size: 0.7rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }

  /* Watchlist list sub-filter */
  .wl-list-filter { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .wl-filter-chip { padding: 0.4rem 1rem; font-size: 0.82rem; font-weight: 600; border-radius: 999px; background: var(--surface); border: 1px solid var(--glass-border); color: var(--text-muted); transition: all 0.2s; cursor: pointer; }
  .wl-filter-chip:hover { border-color: var(--primary); color: var(--text-main); }
  .wl-filter-chip.active { background: rgba(109,40,217,0.15); border-color: rgba(109,40,217,0.4); color: #a78bfa; }

  .category-nav { display: flex; justify-content: center; gap: 0.6rem; margin-bottom: 3rem; flex-wrap: wrap; }
  .cat-link { padding: 0.5rem 1.2rem; background: var(--surface); border: 1px solid var(--glass-border); border-radius: 999px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); transition: all 0.25s ease; cursor: pointer; }
  .cat-link:hover { border-color: var(--primary); color: var(--text-main); }
  .cat-link.active { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border-color: transparent; box-shadow: 0 4px 15px rgba(109,40,217,0.3); }

  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
  .count-badge { font-size: 0.85rem; color: var(--text-muted); background: var(--surface); padding: 4px 12px; border-radius: 6px; border: 1px solid var(--glass-border); }
  .section-title { font-size: 1.8rem; display: flex; align-items: center; gap: 1rem; }
  .section-title::before { content: ""; display: block; width: 24px; height: 4px; background: var(--primary); border-radius: 2px; flex-shrink: 0; }

  .video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }

  .video-card-wrapper { position: relative; }
  .video-card { background: var(--surface); border-radius: 16px; overflow: hidden; border: 1px solid var(--glass-border); transition: transform 0.4s ease, box-shadow 0.4s ease; display: flex; flex-direction: column; height: 100%; text-decoration: none; }
  .video-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow); border-color: rgba(109,40,217,0.3); }
  .video-thumbnail { position: relative; aspect-ratio: 16/9; overflow: hidden; }
  .video-thumbnail img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
  .video-card:hover .video-thumbnail img { transform: scale(1.05); }
  .category-tags-container { position: absolute; top: 0.75rem; left: 0.75rem; z-index: 10; display: flex; flex-wrap: wrap; gap: 0.4rem; max-width: 75%; }
  .category-tag { background: var(--glass-bg); backdrop-filter: blur(8px); padding: 3px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; color: var(--accent); border: 1px solid var(--glass-border); text-transform: uppercase; pointer-events: none; }
  .play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
  .video-card:hover .play-overlay { opacity: 1; }
  .play-button { width: 60px; height: 60px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; padding-left: 5px; border: 1px solid rgba(255,255,255,0.4); transform: scale(0.8); transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
  .video-card:hover .play-button { transform: scale(1); }
  .video-info { padding: 1.25rem 1.5rem 1.5rem; flex-grow: 1; }
  .video-title { font-size: 1.1rem; margin-bottom: 0.4rem; color: var(--text-main); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .video-desc { color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 0.5rem; }
  .series-ep-count { font-size: 0.8rem; color: var(--accent); font-weight: 600; }

  /* Bookmark button */
  .bookmark-btn { position: absolute; top: 0.6rem; right: 0.6rem; width: 36px; height: 36px; background: rgba(10,10,20,0.75); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; transition: all 0.2s ease; opacity: 0; }
  .video-card-wrapper:hover .bookmark-btn { opacity: 1; }
  .bookmark-btn:hover { transform: scale(1.12); background: rgba(109,40,217,0.5); }
  .bookmark-btn.saved { opacity: 1; background: rgba(109,40,217,0.6); border-color: rgba(109,40,217,0.5); }

  /* Saved pills on card */
  .saved-lists-pills { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.4rem 0.6rem; display: flex; gap: 0.3rem; flex-wrap: wrap; pointer-events: none; }
  .saved-pill { font-size: 0.65rem; font-weight: 700; background: rgba(109,40,217,0.75); backdrop-filter: blur(6px); color: white; padding: 2px 8px; border-radius: 999px; }

  /* Empty */
  .empty-state { text-align: center; padding: 4rem 2rem; background: var(--surface); border-radius: 16px; border: 1px dashed var(--glass-border); color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
  .empty-hint { font-size: 0.85rem; opacity: 0.6; }
`;
