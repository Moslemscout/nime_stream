'use client';

import { usePathname } from 'next/navigation';
import NavbarAuth from './NavbarAuth';
import Link from 'next/link';

export default function NavbarWrapper() {
  const pathname = usePathname();

  // Di halaman /admin — tampilkan navbar khusus admin, sembunyikan user info
  if (pathname.startsWith('/admin')) {
    return (
      <div className="admin-nav-indicator">
        <span className="admin-nav-badge">Admin</span>
        <style>{`
          .admin-nav-indicator {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .admin-nav-badge {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #a78bfa;
            background: rgba(109, 40, 217, 0.12);
            border: 1px solid rgba(109, 40, 217, 0.25);
            padding: 3px 10px;
            border-radius: 999px;
          }
          .admin-nav-home {
            font-size: 0.82rem;
            color: var(--text-muted);
            font-weight: 500;
            transition: color 0.2s;
          }
          .admin-nav-home:hover { color: var(--accent); }
        `}</style>
      </div>
    );
  }

  return <NavbarAuth />;
}
