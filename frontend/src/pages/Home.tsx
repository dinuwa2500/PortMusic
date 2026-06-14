import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { BACKEND_URL, useAudioPlayer, ITrack } from '../context/AudioPlayerContext.js';

interface HomeProps {
  setActivePage: (page: string) => void;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
}

const DEFAULT_RECOMMENDATIONS: ITrack[] = [
  {
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    duration: '3:22'
  },
  {
    videoId: '34Na4j8AVgA',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    thumbnail: 'https://img.youtube.com/vi/34Na4j8AVgA/hqdefault.jpg',
    duration: '3:50'
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    duration: '4:24'
  },
  {
    videoId: 'MwpMEbgC7DA',
    title: 'Another Love',
    artist: 'Tom Odell',
    thumbnail: 'https://img.youtube.com/vi/MwpMEbgC7DA/hqdefault.jpg',
    duration: '4:08'
  },
  {
    videoId: '2Vv-BfVoq4g',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    duration: '4:40'
  },
  {
    videoId: 'GCdwKhTtNNw',
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    thumbnail: 'https://img.youtube.com/vi/GCdwKhTtNNw/hqdefault.jpg',
    duration: '4:00'
  }
];

export const Home: React.FC<HomeProps> = ({ setActivePage, setSearchQuery, onSearchSubmit }) => {
  const { playTrack, userId } = useAudioPlayer();
  const [listenAgain, setListenAgain] = useState<ITrack[]>([]);
  const [quickPicks, setQuickPicks] = useState<ITrack[]>(DEFAULT_RECOMMENDATIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 360;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    fetchPersonalizedContent();
  }, [userId]);

  const fetchPersonalizedContent = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch History for "Listen Again"
      const historyRes = await fetch(`${BACKEND_URL}/history?sort=plays&limit=6`, {
        headers: { 'x-user-id': userId }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setListenAgain(historyData);
      }

      // 2. Fetch Favorites for "Quick Picks" (fall back to default recommendations if empty)
      const favoritesRes = await fetch(`${BACKEND_URL}/favorites`, {
        headers: { 'x-user-id': userId }
      });
      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        if (favoritesData.length > 0) {
          // Fill remaining slots with defaults if favorites list is shorter than 6
          const combined = [...favoritesData, ...DEFAULT_RECOMMENDATIONS].slice(0, 6);
          // Deduplicate based on videoId
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.videoId === v.videoId) === i);
          setQuickPicks(unique.slice(0, 6));
        } else {
          setQuickPicks(DEFAULT_RECOMMENDATIONS);
        }
      }
    } catch (err) {
      console.error('Failed to load personalized home sections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickPlay = (track: ITrack) => {
    playTrack(track);
  };

  const handleGenreSearch = (genreName: string) => {
    setSearchQuery(genreName);
    onSearchSubmit(genreName);
  };

  return (
    <div className="home-page">
      <h1 className="greeting-title">{getGreeting()}</h1>

      {/* Mood Filters Quick Navigation */}
      <div className="mood-filters">
        {['Chill', 'Energize', 'Focus', 'Workout', 'Commute', 'Romance'].map(mood => (
          <button 
            key={mood} 
            className="mood-btn"
            onClick={() => handleGenreSearch(mood + ' Music')}
          >
            {mood}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Curating your dashboard...</span>
        </div>
      ) : (
        <>
          {/* Section: Listen Again (YouTube Music Match) */}
          {listenAgain.length > 0 && (
            <section className="home-section listen-again-section animate-fade">
              <div className="listen-again-header">
                <div className="header-left">
                  <div className="avatar-circle">
                    {/* Cool music/developer letter avatar */}
                    <span>T</span>
                  </div>
                  <div className="header-title-group">
                    <span className="user-tag">TAPPY CODER</span>
                    <h2 className="listen-again-title">Listen again</h2>
                  </div>
                </div>
                
                <div className="header-right">
                  <button className="pill-btn-more" onClick={() => setActivePage('library')}>More</button>
                  <div className="carousel-nav">
                    <button className="nav-arrow-btn" onClick={() => scrollCarousel('left')} title="Previous">
                      <ChevronLeft size={16} />
                    </button>
                    <button className="nav-arrow-btn" onClick={() => scrollCarousel('right')} title="Next">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="carousel-container" ref={carouselRef}>
                {listenAgain.map((track, idx) => {
                  // Render the 5th card as an Artist Channel profile (circular image) to match YT Music's visual diversity
                  const isArtistCard = idx === 4;
                  return (
                    <div key={track.videoId} className={`yt-track-card ${isArtistCard ? 'artist-card' : ''}`}>
                      <div 
                        className={`yt-image-container ${isArtistCard ? 'circle-img' : ''}`}
                        onClick={() => handleQuickPlay(track)}
                      >
                        <img src={track.thumbnail} alt={track.title} className="yt-card-img" />
                        <div className="yt-hover-overlay">
                          <Play size={28} fill="white" color="white" />
                        </div>
                      </div>
                      <div className="yt-card-info">
                        <h3 className="yt-card-title" title={isArtistCard ? track.artist : track.title}>
                          {isArtistCard ? track.artist : track.title}
                        </h3>
                        <p className="yt-card-subtitle">
                          {isArtistCard ? 'Artist • 56.3K subscribers' : `Song • ${track.artist}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section: Quick Picks */}
          <section className="home-section animate-fade">
            <div className="section-header">
              <h2>Quick Picks</h2>
              <span className="section-subtitle">Based on your favorites</span>
            </div>
            
            <div className="quick-picks-list">
              {quickPicks.map(track => (
                <div key={track.videoId} className="quick-pick-row">
                  <div className="pick-image-container" onClick={() => handleQuickPlay(track)}>
                    <img src={track.thumbnail} alt={track.title} className="pick-img" />
                    <div className="pick-hover-overlay">
                      <Play size={14} fill="white" />
                    </div>
                  </div>
                  <div className="pick-meta" onClick={() => handleQuickPlay(track)}>
                    <span className="pick-title">{track.title}</span>
                    <span className="pick-artist">{track.artist}</span>
                  </div>
                  <span className="pick-duration">{track.duration}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Prompt banner if brand new library */}
          {listenAgain.length === 0 && (
            <div className="welcome-banner animate-fade">
              <div className="banner-content">
                <h3>Welcome to MusicFree!</h3>
                <p>Search for your favorite tracks and artists to populate your library and get custom suggestions. Complete ad-free and subscription-free listening.</p>
                <button className="banner-action-btn" onClick={() => setActivePage('search')}>
                  Start Searching
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .home-page {
          animation: fadeIn 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .greeting-title {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.8px;
        }

        /* Mood Filters */
        .mood-filters {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none; /* Firefox */
        }
        .mood-filters::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .mood-btn {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 20px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
          white-space: nowrap;
        }

        .mood-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: var(--border-color-hover);
        }

        /* Sections */
        .home-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .section-header h2 {
          font-size: 22px;
          font-weight: 600;
        }

        .section-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-left: 12px;
        }

        .see-all-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .see-all-btn:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        /* Tracks Grid */
        .tracks-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .tracks-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 768px) {
          .tracks-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .track-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: var(--transition-normal);
        }

        .track-card:hover {
          background-color: var(--bg-card-hover);
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
          border-color: var(--border-color-hover);
        }

        .card-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        .card-image-container:hover .card-hover-overlay {
          opacity: 1;
        }

        .card-play-btn {
          background-color: white;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transform: scale(0.9);
          transition: var(--transition-fast);
        }

        .card-play-btn:hover {
          transform: scale(1.05);
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-artist {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Quick Picks Row list */
        .quick-picks-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .quick-picks-list {
            grid-template-columns: 1fr;
          }
        }

        .quick-pick-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px;
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          transition: var(--transition-fast);
        }

        .quick-pick-row:hover {
          background-color: var(--bg-card);
          border-color: var(--border-color-hover);
        }

        .pick-image-container {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
        }

        .pick-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pick-hover-overlay {
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

        .pick-image-container:hover .pick-hover-overlay {
          opacity: 1;
        }

        .pick-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          cursor: pointer;
          overflow: hidden;
        }

        .pick-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pick-artist {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pick-duration {
          font-size: 13px;
          color: var(--text-muted);
          padding-right: 8px;
        }

        /* Banner Welcome */
        .welcome-banner {
          background: linear-gradient(135deg, rgba(255, 51, 68, 0.15) 0%, rgba(255, 102, 51, 0.05) 100%);
          border: 1px solid rgba(255, 51, 68, 0.25);
          border-radius: 12px;
          padding: 32px;
          margin-top: 16px;
        }

        .banner-content {
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }

        .banner-content h3 {
          font-size: 20px;
          font-weight: 600;
        }

        .banner-content p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .banner-action-btn {
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
          margin-top: 8px;
        }

        .banner-action-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        /* Spinner Loading */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 0;
          gap: 16px;
          color: var(--text-secondary);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Listen Again Section (YouTube Music Match) */
        .listen-again-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .listen-again-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 4px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar-circle {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1f1f1f 0%, #2d2d2d 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          color: var(--accent-primary);
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .header-title-group {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .user-tag {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .listen-again-title {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pill-btn-more {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 16px;
          border-radius: 18px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .pill-btn-more:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .carousel-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-arrow-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .nav-arrow-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.3);
          background-color: rgba(255, 255, 255, 0.05);
        }

        /* Carousel Tracks Row */
        .carousel-container {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          padding: 4px 2px;
          scroll-behavior: smooth;
        }

        .carousel-container::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        /* YT Song Cards */
        .yt-track-card {
          width: 170px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: transparent;
          border: none;
          padding: 0;
          gap: 0;
          transition: transform var(--transition-normal);
        }

        .yt-track-card:hover {
          transform: translateY(-2px);
        }

        .yt-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .yt-image-container.circle-img {
          border-radius: 50%;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .yt-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter var(--transition-fast);
        }

        .yt-image-container:hover .yt-card-img {
          filter: brightness(0.7);
        }

        .yt-hover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: var(--transition-fast);
          pointer-events: none;
        }

        .yt-image-container:hover .yt-hover-overlay {
          opacity: 1;
        }

        .yt-card-info {
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .yt-card-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .yt-card-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
};
export default Home;
