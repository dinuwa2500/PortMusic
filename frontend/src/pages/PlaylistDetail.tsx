import React, { useState, useEffect } from 'react';
import { Play, Trash2, ArrowLeft, Music } from 'lucide-react';
import { BACKEND_URL, useAudioPlayer, ITrack } from '../context/AudioPlayerContext.js';

interface PlaylistDetailProps {
  playlistId: string;
  setActivePage: (page: string) => void;
  playlistTrigger: number;
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
}

interface IPlaylist {
  _id: string;
  name: string;
  description?: string;
  tracks: ITrack[];
  createdAt: string;
}

export const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
  playlistId,
  setActivePage,
  playlistTrigger,
  setPlaylistTrigger
}) => {
  const { playTrack, userId } = useAudioPlayer();
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPlaylistDetails();
  }, [playlistId, playlistTrigger, userId]);

  const fetchPlaylistDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/playlists/${playlistId}`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      } else {
        setActivePage('playlists');
      }
    } catch (err) {
      console.error('Failed to fetch playlist details:', err);
      setActivePage('playlists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm(`Are you sure you want to delete the playlist "${playlist.name}"?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        setPlaylistTrigger(prev => prev + 1); // Refresh sidebar playlists
        setActivePage('playlists');
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const handleRemoveTrack = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (!playlist) return;

    try {
      const res = await fetch(`${BACKEND_URL}/playlists/${playlistId}/tracks/${videoId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        setPlaylistTrigger(prev => prev + 1); // Triggers re-fetch
      }
    } catch (err) {
      console.error('Failed to remove track from playlist:', err);
    }
  };

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.tracks.length === 0) return;
    playTrack(playlist.tracks[0], playlist.tracks, true);
  };

  if (isLoading) {
    return (
      <div className="playlist-detail-loading">
        <div className="spinner"></div>
        <span>Opening playlist...</span>
        <style>{`
          .playlist-detail-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            gap: 16px;
          }
        `}</style>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="playlist-detail-page">
      <div className="playlist-back-nav">
        <button className="back-btn" onClick={() => setActivePage('playlists')}>
          <ArrowLeft size={16} />
          <span>Back to Playlists</span>
        </button>
      </div>

      <div className="playlist-banner">
        <div className="playlist-banner-thumb">
          {playlist.tracks.length > 0 ? (
            <img src={playlist.tracks[0].thumbnail} alt={playlist.name} />
          ) : (
            <div className="empty-thumb-banner">
              <Music size={48} className="empty-icon-banner" />
            </div>
          )}
        </div>

        <div className="playlist-banner-meta">
          <span className="meta-label">Playlist</span>
          <h1 className="playlist-title">{playlist.name}</h1>
          {playlist.description && <p className="playlist-desc">{playlist.description}</p>}
          <div className="playlist-stats-banner">
            <span>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</span>
            <span className="dot">•</span>
            <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="playlist-actions-banner">
            {playlist.tracks.length > 0 && (
              <button className="play-playlist-btn" onClick={handlePlayPlaylist}>
                <Play size={16} fill="black" />
                <span>Play</span>
              </button>
            )}
            <button className="delete-playlist-btn" onClick={handleDeletePlaylist} title="Delete Playlist">
              <Trash2 size={16} />
              <span>Delete Playlist</span>
            </button>
          </div>
        </div>
      </div>

      <div className="playlist-tracks-section">
        {playlist.tracks.length === 0 ? (
          <div className="empty-playlist-tracks">
            <Music size={44} className="empty-music-icon-detail" />
            <h3>This playlist is empty</h3>
            <p>Search for songs and add them to "{playlist.name}" to build your list.</p>
            <button className="search-redirect-btn" onClick={() => setActivePage('search')}>
              Go to Search
            </button>
          </div>
        ) : (
          <div className="playlist-tracks-list">
            {playlist.tracks.map((track, index) => (
              <div 
                key={track.videoId + '-' + index} 
                className="playlist-track-row"
                onClick={() => playTrack(track, playlist.tracks, true)}
              >
                <span className="row-index">{index + 1}</span>
                
                <img src={track.thumbnail} alt={track.title} className="track-row-thumb" />
                
                <div className="track-row-meta">
                  <span className="track-row-title" title={track.title}>{track.title}</span>
                  <span className="track-row-artist" title={track.artist}>{track.artist}</span>
                </div>

                <span className="track-row-dur">{track.duration}</span>

                <button 
                  className="remove-from-playlist-btn"
                  onClick={(e) => handleRemoveTrack(e, track.videoId)}
                  title="Remove from Playlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .playlist-detail-page {
          animation: fadeIn 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .playlist-back-nav {
          display: flex;
        }

        .back-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          transition: var(--transition-fast);
        }

        .back-btn:hover {
          color: var(--text-primary);
        }

        /* Playlist Banner */
        .playlist-banner {
          display: flex;
          gap: 32px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
          .playlist-banner {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 20px;
          }
        }

        .playlist-banner-thumb {
          width: 180px;
          height: 180px;
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--bg-card);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          flex-shrink: 0;
        }

        .playlist-banner-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .empty-thumb-banner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.02);
        }

        .empty-icon-banner {
          color: var(--text-muted);
        }

        .playlist-banner-meta {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 8px;
          flex: 1;
        }

        .meta-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--accent-primary);
        }

        .playlist-title {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .playlist-desc {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 600px;
          line-height: 1.5;
        }

        .playlist-stats-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .dot {
          color: var(--text-muted);
        }

        .playlist-actions-banner {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .play-playlist-btn {
          background-color: white;
          color: black;
          border: none;
          padding: 10px 24px;
          border-radius: 24px;
          font-family: inherit;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .play-playlist-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
        }

        .delete-playlist-btn {
          background-color: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 10px 20px;
          border-radius: 24px;
          font-family: inherit;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .delete-playlist-btn:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
          background-color: rgba(255, 51, 68, 0.05);
        }

        /* Tracks List */
        .playlist-tracks-section {
          margin-top: 12px;
        }

        .playlist-tracks-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .playlist-track-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .playlist-track-row:hover {
          background-color: var(--bg-card);
        }

        .row-index {
          width: 20px;
          font-size: 13px;
          color: var(--text-muted);
          text-align: center;
        }

        .track-row-thumb {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .track-row-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .track-row-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-row-artist {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-row-dur {
          font-size: 13px;
          color: var(--text-muted);
          width: 60px;
          text-align: right;
        }

        .remove-from-playlist-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
          opacity: 0;
        }

        .playlist-track-row:hover .remove-from-playlist-btn {
          opacity: 1;
        }

        .remove-from-playlist-btn:hover {
          color: var(--accent-primary);
          background-color: rgba(255, 51, 68, 0.05);
        }

        /* Empty State */
        .empty-playlist-tracks {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px;
          gap: 16px;
        }

        .empty-music-icon-detail {
          color: var(--text-muted);
        }

        .empty-playlist-tracks h3 {
          font-size: 18px;
          color: var(--text-secondary);
        }

        .empty-playlist-tracks p {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 320px;
          line-height: 1.5;
        }

        .search-redirect-btn {
          background-color: var(--bg-card-hover);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 20px;
          border-radius: 20px;
          font-family: inherit;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition-fast);
          margin-top: 8px;
        }

        .search-redirect-btn:hover {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: var(--border-color-hover);
        }
      `}</style>
    </div>
  );
};
export default PlaylistDetail;
