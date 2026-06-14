import React, { useState } from 'react';
import Sidebar from './components/Sidebar.js';
import Header from './components/Header.js';
import PlayerBar from './components/PlayerBar.js';
import QueuePanel from './components/QueuePanel.js';
import Home from './pages/Home.js';
import Search from './pages/Search.js';
import Library from './pages/Library.js';
import Playlists from './pages/Playlists.js';
import PlaylistDetail from './pages/PlaylistDetail.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AudioPlayerProvider, useAudioPlayer, BACKEND_URL, ITrack } from './context/AudioPlayerContext.js';
import MobileNavBar from './components/MobileNavBar.js';
import './styles/globals.css';

const AppContent: React.FC = () => {
  const { userId } = useAudioPlayer();
  const { isLoading } = useAuth();
  const [activePage, setActivePage] = useState<string>('home');
  const [authPage, setAuthPage] = useState<'login' | 'register' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ITrack[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  
  // Triggers to sync playlist state between sidebar, header, detail pages
  const [playlistTrigger, setPlaylistTrigger] = useState<number>(0);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Layout sidebars
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  if (isLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (authPage === 'login') {
    return <Login onNavigateRegister={() => setAuthPage('register')} onSuccess={() => setAuthPage(null)} />;
  }

  if (authPage === 'register') {
    return <Register onNavigateLogin={() => setAuthPage('login')} onSuccess={() => setAuthPage(null)} />;
  }

  const handleSearchSubmit = async (query: string) => {
    setActivePage('search');
    setIsSearchLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to run search queries:', err);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return (
          <Home 
            setActivePage={setActivePage} 
            setSearchQuery={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
          />
        );
      case 'search':
        return (
          <Search 
            searchQuery={searchQuery}
            searchResults={searchResults}
            playlistTrigger={playlistTrigger}
            setPlaylistTrigger={setPlaylistTrigger}
            isLoading={isSearchLoading}
          />
        );
      case 'library':
        return <Library playlistTrigger={playlistTrigger} />;
      case 'playlists':
        return (
          <Playlists 
            playlistTrigger={playlistTrigger}
            setPlaylistTrigger={setPlaylistTrigger}
            setSelectedPlaylistId={setSelectedPlaylistId}
            setActivePage={setActivePage}
          />
        );
      case 'playlist-detail': {
        if (!selectedPlaylistId) {
          setActivePage('playlists');
          return null;
        }
        return (
          <PlaylistDetail 
            playlistId={selectedPlaylistId}
            setActivePage={setActivePage}
            playlistTrigger={playlistTrigger}
            setPlaylistTrigger={setPlaylistTrigger}
          />
        );
      }
      default:
        return <Home setActivePage={setActivePage} setSearchQuery={setSearchQuery} onSearchSubmit={handleSearchSubmit} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        playlistTrigger={playlistTrigger}
        setPlaylistTrigger={setPlaylistTrigger}
        setSelectedPlaylistId={setSelectedPlaylistId}
      />

      {/* Top Search & Actions Bar */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        userId={userId}
        onOpenLogin={() => setAuthPage('login')}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {renderActivePage()}
      </main>

      {/* Slide-out Queue Drawer */}
      <QueuePanel isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />

      {/* Bottom Audio Player Bar */}
      <PlayerBar 
        toggleQueuePanel={() => setIsQueueOpen(!isQueueOpen)} 
        setPlaylistTrigger={setPlaylistTrigger}
      />

      {/* Bottom Mobile Navigation Bar */}
      <MobileNavBar activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <AppContent />
      </AudioPlayerProvider>
    </AuthProvider>
  );
};
export default App;
