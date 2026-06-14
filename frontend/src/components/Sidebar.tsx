import React, { useState, useEffect } from 'react';
import { Home, Search, Library, ListMusic, Plus, Music2 } from 'lucide-react';
import { BACKEND_URL, useAudioPlayer } from '../context/AudioPlayerContext.js';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  playlistTrigger: number; // Trigger to refresh playlists
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
  setSelectedPlaylistId: (id: string | null) => void;
}

interface IPlaylistSummary {
  _id: string;
  name: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  playlistTrigger,
  setPlaylistTrigger,
  setSelectedPlaylistId
}) => {
  const { userId } = useAudioPlayer();
  const [playlists, setPlaylists] = useState<IPlaylistSummary[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState<string>('');

  useEffect(() => {
    fetchPlaylists();
  }, [playlistTrigger]);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/playlists`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Failed to fetch playlists in sidebar:', err);
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
        setPlaylistTrigger(prev => prev + 1);
        setActivePage('playlists');
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActivePage('playlist-detail');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => setActivePage('home')}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff3344" className="logo-icon">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <span className="logo-text">Music<span className="logo-badge">Free</span></span>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activePage === 'home' ? 'active' : ''}`}
          onClick={() => setActivePage('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button 
          className={`nav-item ${activePage === 'search' ? 'active' : ''}`}
          onClick={() => setActivePage('search')}
        >
          <Search size={20} />
          <span>Search</span>
        </button>
        <button 
          className={`nav-item ${activePage === 'library' ? 'active' : ''}`}
          onClick={() => setActivePage('library')}
        >
          <Library size={20} />
          <span>Library</span>
        </button>
        <button 
          className={`nav-item ${activePage === 'playlists' ? 'active' : ''}`}
          onClick={() => setActivePage('playlists')}
        >
          <ListMusic size={20} />
          <span>Playlists</span>
        </button>
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-playlists-section">
        <div className="playlists-header">
          <span className="section-title">My Playlists</span>
          <button className="add-playlist-btn" onClick={() => setShowCreateModal(true)} title="Create Playlist">
            <Plus size={16} />
          </button>
        </div>

        <div className="playlists-list">
          {playlists.length === 0 ? (
            <p className="no-playlists-text">No playlists yet</p>
          ) : (
            playlists.map(playlist => (
              <button 
                key={playlist._id} 
                className="playlist-item-nav"
                onClick={() => handlePlaylistClick(playlist._id)}
              >
                <Music2 size={16} className="playlist-icon" />
                <span className="playlist-name">{playlist.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

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
                  placeholder="My favorite tracks"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea 
                  value={newPlaylistDesc} 
                  onChange={(e) => setNewPlaylistDesc(e.target.value)} 
                  placeholder="Songs for studying, chilling, etc."
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
        .sidebar {
          grid-column: 1;
          grid-row: 1 / 3;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px 24px 8px;
          cursor: pointer;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .logo-badge {
          font-size: 10px;
          background: var(--accent-gradient);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: var(--transition-fast);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-card);
        }

        .nav-item.active {
          color: var(--text-primary);
          background-color: var(--bg-card-hover);
          border-left: 3px solid var(--accent-primary);
          border-radius: 0 8px 8px 0;
          padding-left: 13px; /* visual balancing */
        }

        .sidebar-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 20px 0;
        }

        .sidebar-playlists-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .playlists-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px 12px 8px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
        }

        .add-playlist-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: var(--transition-fast);
        }

        .add-playlist-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-card);
        }

        .playlists-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .no-playlists-text {
          font-size: 13px;
          color: var(--text-muted);
          padding: 8px;
        }

        .playlist-item-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 14px;
          font-weight: 400;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .playlist-item-nav:hover {
          color: var(--text-primary);
          background-color: var(--bg-card);
        }

        .playlist-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          width: 400px;
          max-width: 90%;
        }

        .modal-content h3 {
          margin-bottom: 20px;
          font-size: 20px;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group input, .form-group textarea {
          background-color: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 10px 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
        }

        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          transition: var(--transition-fast);
        }

        .cancel-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .submit-btn {
          background: var(--accent-gradient);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition-fast);
        }

        .submit-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
};
export default Sidebar;
