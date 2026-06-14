import React from 'react';
import { Home, Search, Library, ListMusic } from 'lucide-react';

interface MobileNavBarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activePage, setActivePage }) => {
  return (
    <nav className="mobile-nav-bar glass">
      <button 
        className={`mobile-nav-item ${activePage === 'home' ? 'active' : ''}`}
        onClick={() => setActivePage('home')}
      >
        <Home size={22} />
        <span>Home</span>
      </button>
      <button 
        className={`mobile-nav-item ${activePage === 'search' ? 'active' : ''}`}
        onClick={() => setActivePage('search')}
      >
        <Search size={22} />
        <span>Search</span>
      </button>
      <button 
        className={`mobile-nav-item ${activePage === 'library' ? 'active' : ''}`}
        onClick={() => setActivePage('library')}
      >
        <Library size={22} />
        <span>Library</span>
      </button>
      <button 
        className={`mobile-nav-item ${['playlists', 'playlist-detail'].includes(activePage) ? 'active' : ''}`}
        onClick={() => setActivePage('playlists')}
      >
        <ListMusic size={22} />
        <span>Playlists</span>
      </button>

      <style>{`
        .mobile-nav-bar {
          display: none;
          grid-column: 1;
          grid-row: 3;
          height: 64px;
          border-top: 1px solid var(--border-color);
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 30;
          background-color: rgba(12, 12, 12, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        @media (max-width: 768px) {
          .mobile-nav-bar {
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 0 8px;
          }
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          font-weight: 500;
          transition: var(--transition-fast);
          padding: 8px;
          flex: 1;
        }

        .mobile-nav-item:hover {
          color: var(--text-primary);
        }

        .mobile-nav-item.active {
          color: var(--accent-primary);
        }
      `}</style>
    </nav>
  );
};

export default MobileNavBar;
