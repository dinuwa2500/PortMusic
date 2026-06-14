
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, User, X, LogOut, Settings } from 'lucide-react';
import { BACKEND_URL } from '../context/AudioPlayerContext.js';
import { useAuth } from '../context/AuthContext.js';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  userId: string;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  userId,
  onOpenLogin
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [customServerUrl, setCustomServerUrl] = useState<string>(BACKEND_URL);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (customServerUrl.trim()) {
      localStorage.setItem('yt_music_backend_url', customServerUrl.trim());
      setShowSettingsModal(false);
      window.location.reload();
    }
  };

  // Handle click outside to close suggestions list
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/suggest?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to fetch autocomplete suggestions:', err);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    onSearchSubmit(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <header className="app-header glass">
      <div className="header-navigation">
        <button className="nav-arrow-btn" onClick={() => window.history.back()} title="Back">
          <ChevronLeft size={20} />
        </button>
        <button className="nav-arrow-btn" onClick={() => window.history.forward()} title="Forward">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="header-search-container" ref={containerRef}>
        <form onSubmit={handleSubmit} className="search-form">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={clearSearch}>
              <X size={16} />
            </button>
          )}
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Search size={14} className="suggestion-icon" />
                <span className="suggestion-text">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-user-profile">
        <button 
          className="settings-toggle-btn" 
          onClick={() => setShowSettingsModal(true)} 
          title="Server Connection Settings"
        >
          <Settings size={18} />
        </button>

        {isAuthenticated && user ? (
          <>
            <div className="user-info">
              <span className="user-label">Free Account</span>
              <span className="user-id" title={user.email}>
                {user.username}
              </span>
            </div>
            <div className="profile-avatar" title={user.username}>
              <User size={18} />
            </div>
            <button className="logout-btn" onClick={logout} title="Sign Out">
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="user-info">
              <span className="user-label">Free Account</span>
              <span className="user-id" title={userId}>
                {userId.substring(0, 8)}...
              </span>
            </div>
            <button className="sign-in-btn" onClick={onOpenLogin}>
              Sign In
            </button>
          </>
        )}
      </div>

      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Server Connection Settings</h3>
            <p className="modal-desc">
              On mobile emulators or physical devices, configure the server URL to point to your computer's IP address (e.g. `http://192.168.1.X:5000/api`).
            </p>
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label>API Server URL</label>
                <input 
                  type="url" 
                  value={customServerUrl} 
                  onChange={(e) => setCustomServerUrl(e.target.value)} 
                  placeholder="http://192.168.1.X:5000/api"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    localStorage.removeItem('yt_music_backend_url');
                    window.location.reload();
                  }}
                  style={{ marginRight: 'auto' }}
                  title="Reset to default URL"
                >
                  Reset Default
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save & Reload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .app-header {
          grid-column: 2;
          grid-row: 1;
          height: var(--header-height);
          position: fixed;
          top: 0;
          right: 0;
          left: var(--sidebar-width);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 9;
          border-bottom: 1px solid var(--border-color);
          background-color: rgba(3, 3, 3, 0.7);
        }

        .header-navigation {
          display: flex;
          gap: 8px;
        }

        .nav-arrow-btn {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .nav-arrow-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.08);
          border-color: var(--border-color-hover);
        }

        .header-search-container {
          position: relative;
          width: 480px;
          max-width: 50%;
        }

        .search-form {
          display: flex;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 8px 16px;
          width: 100%;
          transition: var(--transition-fast);
        }

        .search-form:focus-within {
          background-color: var(--bg-card);
          border-color: var(--accent-primary);
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .search-icon {
          color: var(--text-secondary);
          margin-right: 12px;
          flex-shrink: 0;
        }

        .search-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          width: 100%;
          font-family: inherit;
          font-size: 15px;
          font-weight: 400;
        }

        .search-input:focus {
          outline: none;
        }

        .clear-search-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
        }

        .clear-search-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.08);
        }

        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          z-index: 20;
          animation: fadeIn 0.15s ease;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .suggestion-item:hover {
          background-color: var(--bg-card-hover);
        }

        .suggestion-icon {
          color: var(--text-muted);
        }

        .suggestion-text {
          font-size: 14px;
          color: var(--text-primary);
        }

        .header-user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-toggle-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .settings-toggle-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-color-hover);
          background-color: rgba(255, 255, 255, 0.08);
        }

        .modal-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.4;
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
          text-align: left;
        }

        .modal-content h3 {
          margin-bottom: 8px;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
          width: 100%;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group input {
          background-color: var(--bg-main);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 10px 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 14px;
          width: 100%;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          width: 100%;
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

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--accent-primary);
          text-transform: uppercase;
        }

        .user-id {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .profile-avatar {
          background: var(--accent-gradient);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sign-in-btn {
          background: var(--accent-gradient);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .sign-in-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .logout-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .logout-btn:hover {
          color: #ff3344;
          border-color: rgba(255, 51, 68, 0.3);
        }

        @media (max-width: 768px) {
          .app-header {
            left: 0;
            padding: 0 16px;
          }
          .header-navigation {
            display: none;
          }
          .header-search-container {
            width: 70%;
            max-width: 100%;
          }
          .user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
export default Header;
