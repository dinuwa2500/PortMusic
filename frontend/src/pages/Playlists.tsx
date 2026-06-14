import React, { useState, useEffect } from 'react';
import { Plus, ListMusic, Calendar, Music } from 'lucide-react';
import { BACKEND_URL, useAudioPlayer } from '../context/AudioPlayerContext.js';

interface PlaylistsProps {
  playlistTrigger: number;
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
  setSelectedPlaylistId: (id: string | null) => void;
  setActivePage: (page: string) => void;
}

interface IPlaylist {
  _id: string;
  name: string;
  description?: string;
  tracks: any[];
  createdAt: string;
}

export const Playlists: React.FC<PlaylistsProps> = ({
  playlistTrigger,
  setPlaylistTrigger,
  setSelectedPlaylistId,
  setActivePage
}) => {
  const { userId } = useAudioPlayer();
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState<string>('');

  useEffect(() => {
    fetchPlaylists();
  }, [playlistTrigger, userId]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/playlists`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Failed to fetch playlists details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc
        })
      });

      if (res.ok) {
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setShowCreateModal(false);
        setPlaylistTrigger(prev => prev + 1); // Refresh playlists lists
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handlePlaylistSelect = (id: string) => {
    setSelectedPlaylistId(id);
    setActivePage('playlist-detail');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="playlists-page">
      <div className="playlists-page-header">
        <h1>My Playlists</h1>
        <button className="new-playlist-btn" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          <span>New Playlist</span>
        </button>
      </div>

      {isLoading ? (
        <div className="playlists-loading">
          <div className="spinner"></div>
          <span>Loading playlists...</span>
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-playlists-state">
          <ListMusic size={48} className="empty-icon" />
          <h3>No playlists yet</h3>
          <p>Create a custom playlist to group your favorite songs together.</p>
          <button className="create-first-btn" onClick={() => setShowCreateModal(true)}>
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="playlists-cards-grid animate-fade">
          {/* First Card: Quick Add trigger */}
          <div className="playlist-card quick-create-card" onClick={() => setShowCreateModal(true)}>
            <div className="quick-create-inner">
              <Plus size={32} />
              <span>Create New Playlist</span>
            </div>
          </div>

          {playlists.map(pl => {
            const hasTracks = pl.tracks.length > 0;
            const thumbnail = hasTracks ? pl.tracks[0].thumbnail : '';

            return (
              <div 
                key={pl._id} 
                className="playlist-card"
                onClick={() => handlePlaylistSelect(pl._id)}
              >
                <div className="playlist-card-thumbnail">
                  {hasTracks ? (
                    <img src={thumbnail} alt={pl.name} />
                  ) : (
                    <div className="empty-thumbnail">
                      <Music size={36} className="empty-icon-card" />
                    </div>
                  )}
                  <div className="card-hover-overlay">
                    <Plus size={20} />
                  </div>
                </div>

                <div className="playlist-card-info">
                  <h3 className="playlist-card-title">{pl.name}</h3>
                  {pl.description && <p className="playlist-card-desc">{pl.description}</p>}
                  <div className="playlist-card-meta">
                    <span className="track-count">{pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}</span>
                    <span className="created-date">
                      <Calendar size={12} />
                      {formatDate(pl.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={newPlaylistName} 
                  onChange={(e) => setNewPlaylistName(e.target.value)} 
                  placeholder="Coding Sessions"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  value={newPlaylistDesc} 
                  onChange={(e) => setNewPlaylistDesc(e.target.value)} 
                  placeholder="Vibes for working..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .playlists-page {
          animation: fadeIn 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .playlists-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .playlists-page-header h1 {
          font-size: 28px;
          font-weight: 700;
        }

        .new-playlist-btn {
          background: var(--accent-gradient);
          color: white;
          border: none;
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

        .new-playlist-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .playlists-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 0;
          gap: 16px;
        }

        /* Playlist Grid Cards */
        .playlists-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
        }

        @media (max-width: 1200px) {
          .playlists-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .playlists-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .playlist-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: var(--transition-normal);
        }

        .playlist-card:hover {
          background-color: var(--bg-card-hover);
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          border-color: var(--border-color-hover);
        }

        .playlist-card-thumbnail {
          position: relative;
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          background-color: var(--bg-main);
        }

        .playlist-card-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .empty-thumbnail {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.02);
        }

        .empty-icon-card {
          color: var(--text-muted);
        }

        .card-hover-overlay {
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

        .playlist-card:hover .card-hover-overlay {
          opacity: 1;
        }

        .playlist-card-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .playlist-card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .playlist-card-desc {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .playlist-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .created-date {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Quick Create Card */
        .quick-create-card {
          border: 2px dashed var(--border-color);
          background-color: transparent;
          align-items: center;
          justify-content: center;
        }

        .quick-create-card:hover {
          border-color: var(--accent-primary);
          background-color: rgba(255, 51, 68, 0.02);
        }

        .quick-create-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 100%;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 14px;
          text-align: center;
        }

        .quick-create-card:hover .quick-create-inner {
          color: var(--accent-primary);
        }

        /* Empty state */
        .empty-playlists-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 24px;
          gap: 16px;
        }

        .create-first-btn {
          background: var(--accent-gradient);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .create-first-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
export default Playlists;
