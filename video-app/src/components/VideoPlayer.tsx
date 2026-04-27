'use client';

import { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  url480?: string | null;
  url720?: string | null;
  url1080?: string | null;
  thumbnail: string;
}

export default function VideoPlayer({ url480, url720, url1080, thumbnail }: VideoPlayerProps) {
  const [quality, setQuality] = useState<'480p' | '720p' | '1080p'>('720p');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const getCleanUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/(.+?)\/(view|edit|uc)/) || url.match(/id=(.+?)(&|$)/);
      const fileId = match ? match[1] : null;
      if (fileId) return `/api/proxy-video?id=${fileId}`;
    }
    return url;
  };

  const cleanUrl = getCleanUrl(currentUrl);

  // Set initial quality based on what's available
  useEffect(() => {
    if (url1080) {
      setQuality('1080p');
      setCurrentUrl(url1080);
    } else if (url720) {
      setQuality('720p');
      setCurrentUrl(url720);
    } else if (url480) {
      setQuality('480p');
      setCurrentUrl(url480);
    }
  }, [url480, url720, url1080]);

  // Handle quality change and position restoration
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cleanUrl) return;

    // Store state before reload
    const currentTime = video.currentTime;
    const isPaused = video.paused;

    video.load();

    const onMetadata = () => {
      video.currentTime = currentTime;
      if (!isPaused) video.play().catch(() => {});
    };

    video.addEventListener('loadedmetadata', onMetadata);
    return () => video.removeEventListener('loadedmetadata', onMetadata);
  }, [cleanUrl]);

  const handleQualityChange = (newQuality: '480p' | '720p' | '1080p') => {
    const url = newQuality === '480p' ? url480 : newQuality === '720p' ? url720 : url1080;
    if (!url) return;
    setQuality(newQuality);
    setCurrentUrl(url);
  };

  const formatThumbnail = (url: string) => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/(.+?)\/(view|edit)/) || url.match(/id=(.+?)(&|$)/);
      const fileId = match ? match[1] : null;
      if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    return url;
  };

  if (!currentUrl) {
    return (
      <div className="no-video">
        <p>This video has no available source URLs.</p>
      </div>
    );
  }

  return (
    <div className="player-container">
      <div className="player-wrapper">
        <video
          key={cleanUrl} // Force reload on URL change
          ref={videoRef}
          controls
          autoPlay
          poster={formatThumbnail(thumbnail)}
          className="video-player"
        >
          <source src={cleanUrl || ''} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="quality-controls">
        <span className="quality-label">Quality:</span>
        <div className="quality-buttons">
          {url480 && (
            <button 
              className={`q-btn ${quality === '480p' ? 'active' : ''}`}
              onClick={() => handleQualityChange('480p')}
            >
              480p
            </button>
          )}
          {url720 && (
            <button 
              className={`q-btn ${quality === '720p' ? 'active' : ''}`}
              onClick={() => handleQualityChange('720p')}
            >
              720p
            </button>
          )}
          {url1080 && (
            <button 
              className={`q-btn ${quality === '1080p' ? 'active' : ''}`}
              onClick={() => handleQualityChange('1080p')}
            >
              1080p
            </button>
          )}
        </div>
      </div>

      <style>{`
        .player-container {
          width: 100%;
          margin-bottom: 2rem;
        }

        .player-wrapper {
          width: 100%;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(109, 40, 217, 0.2);
          margin-bottom: 1rem;
          border: 1px solid var(--glass-border);
        }

        .video-player {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .quality-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .quality-label {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .quality-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .q-btn {
          padding: 4px 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .q-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-main);
        }

        .q-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .no-video {
          aspect-ratio: 16/9;
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          color: var(--text-muted);
          border: 1px dashed var(--glass-border);
        }
      `}</style>
    </div>
  );
}
