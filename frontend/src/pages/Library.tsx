import React, { useState, useEffect } from 'react';
import { Play, Heart, Trash2, Clock } from 'lucide-react';
import { BACKEND_URL, useAudioPlayer, ITrack } from '../context/AudioPlayerContext.js';

interface LibraryProps {
  playlistTrigger: number;
}

interface IHistoryTrack extends ITrack {
  plays: number;
  playedAt: string;
}

export const Library: React.FC<LibraryProps> = ({ playlistTrigger }) => {
  const { playTrack, userId } = useAudioPlayer();
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  const [favorites, setFavorites] = useState<ITrack[]>([]);
  const [history, setHistory] = useState<IHistoryTrack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLibraryData();
  }, [activeTab, userId, playlistTrigger]);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'favorites') {
        const res = await fetch(`${BACKEND_URL}/favorites`, {
          headers: { 'x-user-id': userId }
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } else {
        const res = await fetch(`${BACKEND_URL}/history`, {
          headers: { 'x-user-id': userId }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch library details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your listening history?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/history`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        setHistory([]);
        alert('Listening history cleared.');
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const formatPlayedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="library-page">
      <div className="library-header-sec">
        <h1>My Library</h1>
        <div className="library-tabs">
          <button
            className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={16} />
            <span>Liked Songs ({favorites.length})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            <span>Listening History ({history.length})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="library-loading">
          <div className="spinner"></div>
          <span>Loading your library...</span>
        </div>
      ) : activeTab === 'favorites' ? (
        favorites.length === 0 ? (
          <div className="empty-library-state">
            <Heart size={44} className="empty-icon" />
            <h3>No liked songs yet</h3>
            <p>Tap the heart icon on any song to save it in your library for quick access.</p>
          </div>
        ) : (
          <div className="library-grid animate-fade">
            {favorites.map(track => (
              <div 
                key={track.videoId} 
                className="library-card"
                onClick={() => playTrack(track, favorites, true)}
              >
                <div className="card-img-wrap">
                  <img src={track.thumbnail} alt={track.title} />
                  <div className="hover-play-icon">
                    <Play size={22} fill="white" />
                  </div>
                </div>
                <div className="card-meta-wrap">
                  <span className="card-title" title={track.title}>{track.title}</span>
                  <span className="card-artist" title={track.artist}>{track.artist}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* History View */
        history.length === 0 ? (
          <div className="empty-library-state">
            <Clock size={44} className="empty-icon" />
            <h3>Your history is clean</h3>
            <p>Songs you stream will appear here along with statistics about your plays.</p>
          </div>
        ) : (
          <div className="history-list-container animate-fade">
            <div className="history-toolbar">
              <span className="history-summary">Total tracks played: {history.length}</span>
              <button className="clear-history-btn" onClick={handleClearHistory}>
                <Trash2 size={14} />
                <span>Clear History</span>
              </button>
            </div>

            <div className="history-rows">
              {history.map((track, index) => (
                <div 
                  key={track.videoId + '-' + index} 
                  className="history-row"
                  onClick={() => playTrack(track, history, true)}
                >
                  <img src={track.thumbnail} alt={track.title} className="row-thumb-img" />
                  <div className="row-details">
                    <span className="row-title" title={track.title}>{track.title}</span>
                    <span className="row-artist" title={track.artist}>{track.artist}</span>
                  </div>
                  <div className="row-stats">
                    <span className="play-count-badge">{track.plays} {track.plays === 1 ? 'play' : 'plays'}</span>
                    <span className="played-time-text">{formatPlayedAt(track.playedAt)}</span>
                  </div>
                  <span className="row-dur">{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      <style>{`
        .library-page {
          animation: fadeIn 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .library-header-sec {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .library-header-sec h1 {
          font-size: 28px;
          font-weight: 700;
        }

        .library-tabs {
          display: flex;
          gap: 8px;
        }

        .tab-btn {
          background-color: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 20px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.03);
          border-color: var(--border-color-hover);
        }

        .tab-btn.active {
          color: var(--text-primary);
          background-color: var(--bg-card-hover);
          border-color: var(--accent-primary);
          box-shadow: 0 0 8px var(--accent-glow);
        }

        /* Loading */
        .library-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
          gap: 16px;
        }

        /* Library Grid */
        .library-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .library-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 768px) {
          .library-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .library-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: var(--transition-normal);
        }

        .library-card:hover {
          background-color: var(--bg-card-hover);
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          border-color: var(--border-color-hover);
        }

        .card-img-wrap {
          position: relative;
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
        }

        .card-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hover-play-icon {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: var(--transition-fast);
        }

        .library-card:hover .hover-play-icon {
          opacity: 1;
        }

        .card-meta-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .card-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-artist {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* History View */
        .history-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-summary {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .clear-history-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          padding: 6px 12px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition-fast);
        }

        .clear-history-btn:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
          background-color: var(--accent-glow);
        }

        .history-rows {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background-color: rgba(255, 255, 255, 0.01);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .history-row:hover {
          background-color: var(--bg-card);
          border-color: var(--border-color-hover);
        }

        .row-thumb-img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .row-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .row-details .row-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-details .row-artist {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 200px;
          justify-content: flex-end;
        }

        .play-count-badge {
          font-size: 11px;
          background-color: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 12px;
          color: var(--text-secondary);
        }

        .played-time-text {
          font-size: 12px;
          color: var(--text-muted);
        }

        .row-dur {
          font-size: 12px;
          color: var(--text-muted);
          width: 50px;
          text-align: right;
        }

        /* Empty state */
        .empty-library-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 24px;
          gap: 12px;
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .empty-library-state h3 {
          font-size: 18px;
          color: var(--text-secondary);
        }

        .empty-library-state p {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 380px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
export default Library;
