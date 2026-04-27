import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import NavbarWrapper from '@/components/NavbarWrapper';

export const metadata: Metadata = {
  title: "T-Stream | Premium Video Platform",
  description: "Experience high-quality streaming tailored for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="main-nav">
          <div className="nav-container">
            <Link href="/dashboard" className="logo">
              <span className="logo-icon">▶</span>
              <span className="logo-text">NimeStream</span>
            </Link>
            <div className="nav-links">
              <Link href="/dashboard" className="nav-link">Home</Link>
              <NavbarWrapper />
            </div>
          </div>
        </nav>
        <main>{children}</main>

        <style>{`
          .main-nav {
            position: sticky;
            top: 0;
            z-index: 50;
            background: var(--glass-bg);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--glass-border);
            padding: 1rem 0;
          }
          .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .logo-icon {
            color: var(--accent);
            font-size: 1.5rem;
            filter: drop-shadow(0 0 10px var(--accent));
            margin-left: 30rem;
          }
          .logo-text {
            font-size: 1.5rem;
            font-weight: 800;
            background: linear-gradient(to right, #f8fafc, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-left: 20px;
          }
          .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
          }
          .nav-link {
            font-weight: 500;
            color: var(--text-muted);
            transition: color 0.3s ease;
          }
          .nav-link:hover {
            color: var(--text-main);
          }
        `}</style>
      </body>
    </html>
  );
}
