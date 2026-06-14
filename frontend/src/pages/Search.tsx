import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, ListPlus, Heart, MoreVertical, Music } from 'lucide-react';
import { BACKEND_URL, useAudioPlayer, ITrack } from '../context/AudioPlayerContext.js';

interface SearchProps {
  searchQuery: string;
  searchResults: ITrack[];
  playlistTrigger: number;
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
}

interface IPlaylistSummary {
  _id: string;
  name: string;
}

export const Search: React.FC<SearchProps> = ({
  searchQuery,
  searchResults,
  playlistTrigger,
  setPlaylistTrigger,
  isLoading
}) => {
  const { playTrack, addToQueue, playNext, userId } = useAudioPlayer();
  const [playlists, setPlaylists] = useState<IPlaylistSummary[]>([]);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<Record<string, boolean>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch playlists on load
  useEffect(() => {
    fetchPlaylists();
  }, [playlistTrigger, userId]);

  // Sync like statuses for all search results
  useEffect(() => {
    if (searchResults.length > 0) {
      checkFavoritesStatuses();
    }
  }, [searchResults, userId]);

  // Handle click outside to close options menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuTrackId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      console.error('Failed to fetch playlists in search:', err);
    }
  };

  const checkFavoritesStatuses = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/favorites`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const favorites: ITrack[] = await res.json();
        const likesMap: Record<string, boolean> = {};
        favorites.forEach(f => {
          likesMap[f.videoId] = true;
        });
        setLikedTrackIds(likesMap);
      }
    } catch (err) {
      console.error('Failed to sync favorites in search:', err);
    }
  };

  const handleFavoriteToggle = async (track: ITrack) => {
    try {
      const res = await fetch(`${BACKEND_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          thumbnail: track.thumbnail,
          duration: track.duration
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLikedTrackIds(prev => ({
          ...prev,
          [track.videoId]: data.liked
        }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, track: ITrack) => {
    try {
      const res = await fetch(`${BACKEND_URL}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          thumbnail: track.thumbnail,
          duration: track.duration
        })
      });

      if (res.ok) {
        setActiveMenuTrackId(null);
        setPlaylistTrigger(prev => prev + 1);
        alert('Song added to playlist!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add to playlist');
      }
    } catch (err) {
      console.error('Failed to add to playlist:', err);
    }
  };

  const toggleTrackMenu = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    setActiveMenuTrackId(activeMenuTrackId === videoId ? null : videoId);
  };

  return (
    <div className="search-page">
      <div className="search-header-sec">
        <h2>{searchQuery ? `Search results for "${searchQuery}"` : 'Discover music'}</h2>
      </div>

      {isLoading ? (
        <div className="search-loading-state">
          <div className="spinner"></div>
          <span>Searching</span>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="empty-search-state">
          <Music size={48} className="empty-music-icon" />
          {searchQuery ? (
            <>
              <h3>No results found</h3>
              <p>Try refining your query, checking spellings, or searching a different artist.</p>
            </>
          ) : (
            <>
              <h3>Type in the search bar</h3>
              <p>Search for any track, video title, artist, or album to stream music instantly.</p>
            </>
          )}
        </div>
      ) : (
        <div className="search-results-list">
          {searchResults.map((track, index) => {
            const isLiked = !!likedTrackIds[track.videoId];
            const isMenuOpen = activeMenuTrackId === track.videoId;

            return (
              <div 
                key={track.videoId + '-' + index} 
                className="search-result-row"
                onClick={() => playTrack(track)}
              >
                <div className="row-play-thumbnail">
                  <img src={track.thumbnail} alt={track.title} className="row-thumb" />
                  <div className="row-play-overlay">
                    <Play size={16} fill="white" />
                  </div>
                </div>

                <div className="row-meta">
                  <span className="row-title" title={track.title}>{track.title}</span>
                  <span className="row-artist" title={track.artist}>{track.artist}</span>
                </div>

                <span className="row-views">{track.views || '0 views'}</span>
                
                <span className="row-duration">{track.duration}</span>

                <div className="row-actions" onClick={e => e.stopPropagation()}>
                  <button 
                    className={`action-btn-row ${isLiked ? 'liked' : ''}`}
                    onClick={() => handleFavoriteToggle(track)}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart size={16} fill={isLiked ? "var(--accent-primary)" : "none"} />
                  </button>

                  <div className="options-menu-container">
                    <button 
                      className="action-btn-row" 
                      onClick={(e) => toggleTrackMenu(e, track.videoId)}
                      title="Options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {isMenuOpen && (
                      <div className="row-dropdown-menu" ref={menuRef}>
                        <button 
                          className="menu-option" 
                          onClick={() => { playNext(track); setActiveMenuTrackId(null); }}
                        >
                          <Plus size={14} />
                          <span>Play Next</span>
                        </button>
                        <button 
                          className="menu-option" 
                          onClick={() => { addToQueue(track); setActiveMenuTrackId(null); }}
                        >
                          <ListPlus size={14} />
                          <span>Add to Queue</span>
                        </button>
                        <div className="menu-divider" />
                        <span className="menu-submenu-title">Add to Playlist:</span>
                        {playlists.length === 0 ? (
                          <span className="menu-submenu-empty">No playlists created</span>
                        ) : (
                          playlists.map(pl => (
                            <button
                              key={pl._id}
                              className="menu-submenu-item"
                              onClick={() => addTrackToPlaylist(pl._id, track)}
                            >
                              {pl.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .search-page {
          animation: fadeIn 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .search-header-sec h2 {
          font-size: 24px;
          font-weight: 600;
        }

        .search-results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .search-result-row {
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

        .search-result-row:hover {
          background-color: var(--bg-card);
          border-color: var(--border-color-hover);
        }

        .row-play-thumbnail {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .row-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .row-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: var(--transition-fast);
        }

        .search-result-row:hover .row-play-overlay {
          opacity: 1;
        }

        .row-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .row-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-artist {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-views {
          font-size: 13px;
          color: var(--text-muted);
          width: 120px;
        }

        .row-duration {
          font-size: 13px;
          color: var(--text-muted);
          width: 60px;
          text-align: right;
        }

        .row-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .action-btn-row {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .action-btn-row:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .action-btn-row.liked {
          color: var(--accent-primary);
        }

        /* Dropdown options menu */
        .options-menu-container {
          position: relative;
        }

        .row-dropdown-menu {
          position: absolute;
          top: 36px;
          right: 0;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          padding: 8px;
          width: 200px;
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.15s ease;
        }

        .menu-option {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 12px;
          text-align: left;
          font-family: inherit;
          font-size: 13px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-fast);
        }

        .menu-option:hover {
          color: var(--text-primary);
          background-color: var(--bg-card-hover);
        }

        .menu-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 6px 0;
        }

        .menu-submenu-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          color: var(--text-muted);
          padding: 4px 12px;
        }

        .menu-submenu-empty {
          font-size: 12px;
          color: var(--text-muted);
          padding: 4px 12px;
        }

        .menu-submenu-item {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px 6px 20px;
          text-align: left;
          font-family: inherit;
          font-size: 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .menu-submenu-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-card-hover);
        }

        /* Loading / Empty States */
        .search-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 16px;
          color: var(--text-secondary);
        }

        .empty-search-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px;
          gap: 12px;
        }

        .empty-music-icon {
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .empty-search-state h3 {
          font-size: 18px;
          color: var(--text-secondary);
        }

        .empty-search-state p {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 400px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .row-views {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
export default Search;
