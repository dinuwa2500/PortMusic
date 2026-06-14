import React from 'react';
import { X, Trash2, Play, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext.js';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    autoplayEnabled,
    autoplayTracks,
    isAutoplayLoading,
    playTrack,
    removeFromQueue,
    clearQueue,
    toggleAutoplay
  } = useAudioPlayer();

  if (!isOpen) return null;

  return (
    <div className="queue-panel-overlay">
      <div className="queue-panel glass">
        <div className="queue-header">
          <h3 className="queue-title">Play Queue</h3>
          <div className="queue-header-actions">
            <div className="autoplay-toggle-container">
              <span className="autoplay-toggle-label">Autoplay</span>
              <label className="switch-toggle" title="Autoplay similar songs when queue ends">
                <input type="checkbox" checked={autoplayEnabled} onChange={toggleAutoplay} />
                <span className="slider-switch round"></span>
              </label>
            </div>
            {queue.length > 0 && (
              <button className="clear-all-btn" onClick={clearQueue} title="Clear Queue">
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            )}
            <button className="close-panel-btn" onClick={onClose} title="Close Panel">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="queue-tracks-list">
          {queue.length === 0 ? (
            <div className="empty-queue-container">
              <p className="empty-text">Your play queue is empty</p>
              <p className="empty-subtext">Add songs from Search or Home to keep the music playing</p>
            </div>
          ) : (
            queue.map((track, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div key={track.videoId + '-' + idx} className={`queue-track-item ${isActive ? 'active' : ''}`}>
                  <div className="track-index-overlay" onClick={() => playTrack(track)}>
                    <img src={track.thumbnail} alt={track.title} className="track-thumb" />
                    <div className="track-play-hover">
                      {isActive && isPlaying ? <Volume2 size={16} /> : <Play size={16} fill="white" />}
                    </div>
                  </div>
                  
                  <div className="track-meta" onClick={() => playTrack(track)}>
                    <span className="track-title">{track.title}</span>
                    <span className="track-artist">{track.artist}</span>
                  </div>

                  <span className="track-duration">{track.duration}</span>
                  
                  <button
                    className="remove-track-btn"
                    onClick={() => removeFromQueue(idx)}
                    title="Remove from Queue"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })
          )}

          {autoplayEnabled && currentTrack && autoplayTracks.length > 0 && (
            <div className="autoplay-tracks-container">
              <div className="autoplay-section-header">
                <div>
                  <span className="autoplay-section-title">Autoplay</span>
                  <span className="autoplay-section-subtitle">Similar songs based on your taste</span>
                </div>
                {isAutoplayLoading && <span className="autoplay-loading-tag">Loading...</span>}
              </div>
              
              <div className="autoplay-tracks-list">
                {autoplayTracks.map((track, idx) => (
                  <div key={'auto-' + track.videoId + '-' + idx} className="queue-track-item autoplay-track-item">
                    <div className="track-index-overlay" onClick={() => playTrack(track)}>
                      <img src={track.thumbnail} alt={track.title} className="track-thumb" />
                      <div className="track-play-hover">
                        <Play size={16} fill="white" />
                      </div>
                    </div>
                    
                    <div className="track-meta" onClick={() => playTrack(track)}>
                      <span className="track-title" title={track.title}>{track.title}</span>
                      <span className="track-artist" title={track.artist}>{track.artist}</span>
                    </div>

                    <span className="track-duration">{track.duration}</span>
                    <span className="autoplay-badge">Auto</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .queue-panel-overlay {
          position: fixed;
          top: 0;
          right: 0;
          bottom: var(--player-height);
          left: 0;
          background-color: rgba(0, 0, 0, 0.4);
          z-index: 25;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease;
        }

        .queue-panel {
          width: 380px;
          height: 100%;
          background-color: rgba(12, 12, 12, 0.95);
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 24px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .queue-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .queue-title {
          font-size: 18px;
          font-weight: 600;
        }

        .queue-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .clear-all-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .clear-all-btn:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
          background-color: var(--accent-glow);
        }

        .close-panel-btn {
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

        .close-panel-btn:hover {
          color: var(--text-primary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .queue-tracks-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .empty-queue-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 24px;
        }

        .empty-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .empty-subtext {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .queue-track-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          transition: var(--transition-fast);
        }

        .queue-track-item:hover {
          background-color: var(--bg-card);
        }

        .queue-track-item.active {
          background-color: rgba(255, 51, 68, 0.08);
          border: 1px solid rgba(255, 51, 68, 0.15);
        }

        .queue-track-item.active .track-title {
          color: var(--accent-primary);
          font-weight: 500;
        }

        .track-index-overlay {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
        }

        .track-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .track-play-hover {
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

        .track-index-overlay:hover .track-play-hover {
          opacity: 1;
        }

        .queue-track-item.active .track-play-hover {
          opacity: 1;
          background-color: rgba(0, 0, 0, 0.4);
        }

        .track-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
          cursor: pointer;
        }

        .track-title {
          font-size: 13px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-artist {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-duration {
          font-size: 12px;
          color: var(--text-muted);
          margin-right: 4px;
        }

        .remove-track-btn {
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

        .queue-track-item:hover .remove-track-btn {
          opacity: 1;
        }

        .remove-track-btn:hover {
          color: var(--accent-primary);
          background-color: rgba(255, 51, 68, 0.05);
        }

        .autoplay-toggle-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-right: 8px;
        }

        .autoplay-toggle-label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .switch-toggle {
          position: relative;
          display: inline-block;
          width: 34px;
          height: 20px;
        }

        .switch-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider-switch {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .3s;
          border: 1px solid var(--border-color);
        }

        .slider-switch:before {
          position: absolute;
          content: "";
          height: 12px;
          width: 12px;
          left: 3px;
          bottom: 3px;
          background-color: var(--text-secondary);
          transition: .3s;
        }

        input:checked + .slider-switch {
          background-color: rgba(255, 51, 68, 0.2);
          border-color: var(--accent-primary);
        }

        input:checked + .slider-switch:before {
          transform: translateX(14px);
          background-color: var(--accent-primary);
        }

        .slider-switch.round {
          border-radius: 20px;
        }

        .slider-switch.round:before {
          border-radius: 50%;
        }

        .autoplay-tracks-container {
          margin-top: 16px;
          border-top: 1px dashed var(--border-color);
          padding-top: 16px;
        }

        .autoplay-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 8px 12px 8px;
        }

        .autoplay-section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
        }

        .autoplay-section-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          display: block;
          margin-top: 2px;
        }

        .autoplay-loading-tag {
          font-size: 11px;
          color: var(--accent-primary);
        }

        .autoplay-tracks-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .autoplay-track-item {
          background-color: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .autoplay-track-item:hover {
          background-color: rgba(255, 255, 255, 0.03);
          border-color: var(--border-color-hover);
        }

        .autoplay-badge {
          font-size: 9px;
          font-weight: 600;
          color: var(--accent-primary);
          background-color: rgba(255, 51, 68, 0.1);
          border: 1px solid rgba(255, 51, 68, 0.25);
          padding: 2px 6px;
          border-radius: 10px;
          margin-right: 4px;
        }

        @media (max-width: 480px) {
          .queue-panel {
            width: 100vw;
          }
        }
      `}</style>
    </div>
  );
};
export default QueuePanel;
