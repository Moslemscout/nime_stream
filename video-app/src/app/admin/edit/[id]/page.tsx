import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { updateVideo } from '../../actions';
import Link from 'next/link';

export default async function EditSeriesPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id }
  });

  if (!video) {
    notFound();
  }

  const categories = ["Action", "Adventure", "Comedy", "Drama", "Sci-Fi", "Fantasy", "Horror", "Mystery", "Romance"];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <Link href="/admin" className="back-link">← Back to Dashboard</Link>
        <h1>Edit Series Meta</h1>
        <p>Updating: {video.title}</p>
        <Link href={`/admin/episodes/${video.id}`} className="manage-episodes-shortcut">
          Manage Episodes & Video Links →
        </Link>
      </div>

      <div className="edit-content">
        <form action={async (formData) => {
          'use server'
          await updateVideo(video.id, formData);
          redirect('/admin');
        }} className="glass-form">
          <div className="form-group">
            <label htmlFor="title">Series Title</label>
            <input type="text" id="title" name="title" required defaultValue={video.title} />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" required rows={6} defaultValue={video.description}></textarea>
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
                    defaultChecked={video.categories.includes(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="thumbnail">Thumbnail URL</label>
            <input type="url" id="thumbnail" name="thumbnail" required defaultValue={video.thumbnail} />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">Update Series</button>
            <Link href="/admin" className="cancel-btn">Cancel</Link>
          </div>
        </form>
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
        .admin-header { margin-bottom: 2rem; }
        .back-link { color: var(--text-muted); margin-bottom: 1rem; display: block; }
        h1 { font-size: 2.5rem; background: linear-gradient(to right, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .manage-episodes-shortcut {
          display: inline-block;
          margin-top: 1rem;
          background: rgba(236, 72, 153, 0.1);
          color: #f472b6;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(236, 72, 153, 0.2);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .manage-episodes-shortcut:hover {
          background: rgba(236, 72, 153, 0.2);
          transform: translateX(5px);
        }

        .glass-form { background: var(--surface); padding: 2.5rem; border-radius: 16px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        label { color: var(--text-muted); font-weight: 500; }
        input, textarea { padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; }
        
        .category-checkboxes { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 8px; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; }

        .form-actions { display: flex; gap: 1rem; margin-top: 1rem; }
        .submit-btn { flex: 2; padding: 1rem; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; font-weight: 600; }
        .cancel-btn { flex: 1; padding: 1rem; border-radius: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border); text-align: center; }
      `}</style>
    </div>
  );
}
