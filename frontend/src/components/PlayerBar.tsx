import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Plus
} from 'lucide-react';
import { BACKEND_URL, useAudioPlayer } from '../context/AudioPlayerContext.js';

interface PlayerBarProps {
  toggleQueuePanel: () => void;
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
}

interface IPlaylistSummary {
  _id: string;
  name: string;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  toggleQueuePanel,
  setPlaylistTrigger
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    isLooping,
    isShuffled,
    userId,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    adjustVolume,
    toggleMute,
    toggleLoop,
    toggleShuffle
  } = useAudioPlayer();

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [playlists, setPlaylists] = useState<IPlaylistSummary[]>([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState<boolean>(false);

  // Fetch whether current song is favorited and list user playlists
  useEffect(() => {
    if (!currentTrack) {
      setIsLiked(false);
      return;
    }
    checkLikeStatus(currentTrack.videoId);
    fetchPlaylists();
  }, [currentTrack, userId]);

  const checkLikeStatus = async (videoId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/favorites/check/${videoId}`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
      }
    } catch (err) {
      console.error('Failed to check favorite status:', err);
    }
  };

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
      console.error('Failed to fetch playlists:', err);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentTrack) return;
    try {
      const res = await fetch(`${BACKEND_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          videoId: currentTrack.videoId,
          title: currentTrack.title,
          artist: currentTrack.artist,
          thumbnail: currentTrack.thumbnail,
          duration: currentTrack.duration
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const addTrackToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    try {
      const res = await fetch(`${BACKEND_URL}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          videoId: currentTrack.videoId,
          title: currentTrack.title,
          artist: currentTrack.artist,
          thumbnail: currentTrack.thumbnail,
          duration: currentTrack.duration
        })
      });

      if (res.ok) {
        setShowPlaylistDropdown(false);
        setPlaylistTrigger(prev => prev + 1);
        alert('Added to playlist successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add to playlist');
      }
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentTrack) {
    return (
      <div className="player-bar empty-player glass">
        <p className="no-track-message">Select a song to start listening</p>
        <style>{`
          .empty-player {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-player);
          }
          .no-track-message {
            font-size: 14px;
            color: var(--text-muted);
            font-weight: 500;
          }
          .player-bar {
            grid-column: 1 / 3;
            grid-row: 2;
            height: var(--player-height);
            border-top: 1px solid var(--border-color);
            padding: 0 24px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 30;
          }
          @media (max-width: 768px) {
            .player-bar {
              bottom: 64px;
              padding: 0 12px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="player-bar glass">
      {/* Left: Song Info */}
      <div className="player-song-info">
        <img src={currentTrack.thumbnail} alt={currentTrack.title} className="player-song-thumbnail" />
        <div className="player-song-meta">
          <h4 className="player-song-title" title={currentTrack.title}>{currentTrack.title}</h4>
          <p className="player-song-artist" title={currentTrack.artist}>{currentTrack.artist}</p>
        </div>
        <div className="player-song-actions">
          <button
            className={`song-action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeToggle}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={18} fill={isLiked ? "var(--accent-primary)" : "none"} />
          </button>
          
          <div className="playlist-add-container">
            <button
              className="song-action-btn"
              onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
              title="Add to Playlist"
            >
              <Plus size={18} />
            </button>
            {showPlaylistDropdown && (
              <div className="playlist-dropdown-menu">
                <span className="dropdown-title">Add to Playlist</span>
                <div className="dropdown-divider" />
                {playlists.length === 0 ? (
                  <span className="dropdown-empty">No playlists. Create one in the sidebar!</span>
                ) : (
                  playlists.map(pl => (
                    <button
                      key={pl._id}
                      className="dropdown-item"
                      onClick={() => addTrackToPlaylist(pl._id)}
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

      {/* Center: Playback Controls */}
      <div className="player-central-controls">
        <div className="controls-buttons">
          <button
            className={`control-btn ${isShuffled ? 'active' : ''}`}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button className="control-btn" onClick={prevTrack} title="Previous">
            <SkipBack size={18} />
          </button>
          <button className="play-pause-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" style={{ marginLeft: 2 }} />}
          </button>
          <button className="control-btn" onClick={nextTrack} title="Next">
            <SkipForward size={18} />
          </button>
          <button
            className={`control-btn ${isLooping ? 'active' : ''}`}
            onClick={toggleLoop}
            title="Repeat"
          >
            <Repeat size={16} />
          </button>
        </div>

        <div className="timeline-container slider-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className="timeline-slider"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Audio Volume / Queue trigger */}
      <div className="player-right-controls">
        <button className="control-btn" onClick={toggleQueuePanel} title="Queue">
          <ListMusic size={20} />
        </button>

        <div className="volume-control-container slider-container">
          <button className="control-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => adjustVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      <style>{`
        .player-bar {
          grid-column: 1 / 3;
          grid-row: 2;
          height: var(--player-height);
          border-top: 1px solid var(--border-color);
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 30;
          background-color: rgba(12, 12, 12, 0.9);
        }

        /* Left Section */
        .player-song-info {
          display: flex;
          align-items: center;
          width: 30%;
          gap: 12px;
        }

        .player-song-thumbnail {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }

        .player-song-meta {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .player-song-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .player-song-artist {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .player-song-actions {
          display: flex;
          gap: 4px;
          align-items: center;
          margin-left: 8px;
          position: relative;
        }

        .song-action-btn {
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

        .song-action-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .song-action-btn.liked {
          color: var(--accent-primary);
        }

        /* Playlist dropdown menu */
        .playlist-add-container {
          position: relative;
        }

        .playlist-dropdown-menu {
          position: absolute;
          bottom: 40px;
          left: 0;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          padding: 8px;
          width: 220px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.15s ease;
        }

        .dropdown-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          color: var(--text-muted);
          padding: 4px 8px;
        }

        .dropdown-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 4px 0;
        }

        .dropdown-empty {
          font-size: 12px;
          color: var(--text-muted);
          padding: 8px;
          text-align: center;
        }

        .dropdown-item {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 12px;
          text-align: left;
          font-family: inherit;
          font-size: 13px;
          border-radius: 4px;
          cursor: pointer;
          transition: var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-card-hover);
        }

        /* Center Section */
        .player-central-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 40%;
          gap: 6px;
        }

        .controls-buttons {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .control-btn {
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

        .control-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .control-btn.active {
          color: var(--accent-primary);
        }

        .play-pause-btn {
          background-color: white;
          color: black;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .play-pause-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }

        .timeline-container {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 12px;
        }

        .time-display {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          min-width: 30px;
          text-align: center;
        }

        /* Right Section */
        .player-right-controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          width: 30%;
          gap: 16px;
        }

        .volume-control-container {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 120px;
        }

        .volume-slider {
          flex: 1;
        }

        @media (max-width: 768px) {
          .player-bar {
            padding: 0 12px;
            bottom: 64px; /* Offset by MobileNavBar height */
          }
          .player-song-info {
            width: 50%;
          }
          .player-central-controls {
            width: 50%;
          }
          .timeline-container {
            display: none;
          }
          .player-right-controls {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
export default PlayerBar;
