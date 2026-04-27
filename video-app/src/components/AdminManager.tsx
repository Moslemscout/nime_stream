'use client';

import { useState } from 'react';
import { addVideo, updateVideo, deleteVideo, addEpisode, deleteEpisode } from '@/app/admin/actions';

interface Episode {
  id: string;
  number: number;
  title: string | null;
  url480: string | null;
  url720: string | null;
  url1080: string | null;
}

interface Video {
  id: string;
  title: string;
  description: string;
  categories: string;
  thumbnail: string;
  episodes: Episode[];
}

export default function AdminManager({ initialVideos }: { initialVideos: Video[] }) {
  const [editingSeries, setEditingSeries] = useState<Video | null>(null);
  const [managingEpisodes, setManagingEpisodes] = useState<Video | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const categories = ["Action", "Comedy", "Drama", "Sci-Fi", "Documentary", "Horror", "Animation", "Romance"];

  return (
    <div className="admin-content">
      {/* SERIES FORM (Add or Edit) */}
      {(isAddingNew || editingSeries) && (
        <div className="overlay">
          <div className="modal glass-form">
            <h2>{editingSeries ? `Edit Series: ${editingSeries.title}` : 'Add New Series'}</h2>
            <form action={async (formData) => {
              if (editingSeries) {
                await updateVideo(editingSeries.id, formData);
                setEditingSeries(null);
              } else {
                await addVideo(formData);
                setIsAddingNew(false);
              }
            }}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input type="text" id="title" name="title" required defaultValue={editingSeries?.title || ''} />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" required rows={4} defaultValue={editingSeries?.description || ''}></textarea>
              </div>
              <div className="form-group">
                <label>Categories</label>
                <div className="category-checkboxes">
                  {categories.map(cat => (
                    <label key={cat} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="categories" 
                        value={cat} 
                        defaultChecked={editingSeries?.categories.includes(cat)} 
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="thumbnail">Thumbnail URL</label>
                <input type="url" id="thumbnail" name="thumbnail" required defaultValue={editingSeries?.thumbnail || ''} />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">{editingSeries ? 'Update' : 'Save'}</button>
                <button type="button" className="cancel-btn" onClick={() => { setEditingSeries(null); setIsAddingNew(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EPISODE MANAGEMENT MODAL */}
      {managingEpisodes && (
        <div className="overlay">
          <div className="modal glass-form wide">
            <h2>Manage Episodes: {managingEpisodes.title}</h2>
            <div className="episode-layout">
              <div className="add-episode-col">
                <h3>Add Episode</h3>
                <form action={async (formData) => {
                  await addEpisode(managingEpisodes.id, formData);
                }}>
                  <div className="form-group">
                    <label>Episode Number</label>
                    <input type="number" name="number" required defaultValue={managingEpisodes.episodes.length + 1} />
                  </div>
                  <div className="form-group">
                    <label>Episode Title (Optional)</label>
                    <input type="text" name="title" placeholder="Optional title" />
                  </div>
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>480p URL</label>
                      <input type="url" name="url480" placeholder="Direct link" />
                    </div>
                    <div className="form-group flex-1">
                      <label>720p URL</label>
                      <input type="url" name="url720" placeholder="Direct link" />
                    </div>
                    <div className="form-group flex-1">
                      <label>1080p URL</label>
                      <input type="url" name="url1080" placeholder="Direct link" />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn small">+ Add Episode</button>
                </form>
              </div>
              <div className="episode-list-col">
                <h3>Current Episodes</h3>
                <div className="ep-list">
                  {managingEpisodes.episodes.length === 0 ? (
                    <p className="text-muted">No episodes yet.</p>
                  ) : (
                    managingEpisodes.episodes.map(ep => (
                      <div key={ep.id} className="ep-item">
                        <span>Ep {ep.number}: {ep.title || 'Untitled'}</span>
                        <button className="del-icon" onClick={async () => await deleteEpisode(ep.id)}>×</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <button type="button" className="cancel-pill" onClick={() => setManagingEpisodes(initialVideos.find(v => v.id === managingEpisodes.id) || null)}>Refresh</button>
            <button type="button" className="cancel-btn" onClick={() => setManagingEpisodes(null)}>Close</button>
          </div>
        </div>
      )}

      {/* MAIN LIST VIEW */}
      <div className="list-view-header">
        <h2>Series Management</h2>
        <button className="add-new-btn" onClick={() => setIsAddingNew(true)}>+ New Series</button>
      </div>

      <div className="video-list">
        {initialVideos.length === 0 ? (
          <p className="text-muted">No series found.</p>
        ) : (
          initialVideos.map(video => (
            <div key={video.id} className="admin-video-card">
              <img src={video.thumbnail} alt={video.title} className="admin-thumb" />
              <div className="admin-video-info">
                <div className="title-row">
                  <h3>{video.title}</h3>
                  <div className="cat-badge-container">
                    {video.categories.split(', ').map(cat => (
                      <span key={cat} className="cat-badge">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="series-meta">
                  <span>{video.episodes.length} Episodes</span>
                </div>
              </div>
              <div className="admin-actions">
                <button className="manage-btn" onClick={() => setManagingEpisodes(video)}>Episodes</button>
                <button className="edit-btn" onClick={() => setEditingSeries(video)}>Edit</button>
                <button className="delete-btn" onClick={async () => {
                  if (confirm('Delete this series and all episodes?')) await deleteVideo(video.id);
                }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .list-view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .add-new-btn {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(109, 40, 217, 0.4);
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .modal {
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal.wide {
          max-width: 1000px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .cancel-btn {
          padding: 1rem;
          border-radius: 8px;
          background: var(--surface-hover);
          color: white;
          border: 1px solid var(--glass-border);
          flex: 1;
        }

        .submit-btn {
          flex: 2;
        }

        .episode-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .ep-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .ep-item {
          background: rgba(255,255,255,0.05);
          padding: 0.75rem 1rem;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .del-icon {
          color: #ef4444;
          font-size: 1.5rem;
        }

        .admin-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn {
          background: rgba(109, 40, 217, 0.1);
          color: #a78bfa;
          border: 1px solid rgba(109, 40, 217, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 6px;
        }

        .manage-btn {
          background: rgba(236, 72, 153, 0.1);
          color: #f472b6;
          border: 1px solid rgba(236, 72, 153, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 6px;
        }

        .series-meta {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .cancel-pill {
          margin: 1rem 0;
          color: var(--accent);
          font-size: 0.8rem;
          text-decoration: underline;
        }

        h2 { margin-bottom: 1.5rem; }
        h3 { margin-bottom: 1rem; color: var(--text-muted); font-size: 1.1rem; }
      `}</style>
    </div>
  );
}
