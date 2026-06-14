import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { useAuth } from './AuthContext';

export interface ITrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  views?: string;
}

interface AudioPlayerContextType {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  progress: number; // 0 to 100
  volume: number; // 0 to 1
  isMuted: boolean;
  isLooping: boolean;
  isShuffled: boolean;
  queue: ITrack[];
  currentIndex: number;
  userId: string;
  autoplayEnabled: boolean;
  autoplayTracks: ITrack[];
  isAutoplayLoading: boolean;
  playTrack: (track: ITrack, newQueue?: ITrack[], isPlaylist?: boolean) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (progressPercent: number) => void;
  adjustVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  addToQueue: (track: ITrack) => void;
  playNext: (track: ITrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleAutoplay: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const getInitialBackendUrl = (): string => {
  const saved = localStorage.getItem('yt_music_backend_url');
  if (saved) return saved;
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl;
  return 'http://localhost:5000/api';
};

export const BACKEND_URL = getInitialBackendUrl();

// Generate or fetch a persistent user ID from localStorage
const getOrCreateUserId = (): string => {
  let id = localStorage.getItem('yt_music_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('yt_music_user_id', id);
  }
  return id;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [anonymousId] = useState<string>(getOrCreateUserId);
  const userId = user?.id || anonymousId;
  const [queue, setQueue] = useState<ITrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [currentTrack, setCurrentTrack] = useState<ITrack | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  
  const [originalQueue, setOriginalQueue] = useState<ITrack[]>([]); // Track original queue for unshuffling

  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('yt_music_autoplay_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoplayTracks, setAutoplayTracks] = useState<ITrack[]>([]);
  const [isAutoplayLoading, setIsAutoplayLoading] = useState<boolean>(false);

  const playerRef = useRef<ReactPlayer>(null);
  const _pendingAutoPlayRef = useRef(false);

  // Sync currentTrack with queue and index
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < queue.length) {
      const track = queue[currentIndex];
      setCurrentTrack(track);
      
      // Send playback report to backend history database
      reportPlaybackToHistory(track);
    } else {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, [currentIndex, queue]);

  const reportPlaybackToHistory = async (track: ITrack) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': userId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${BACKEND_URL}/history`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          thumbnail: track.thumbnail,
          duration: track.duration
        })
      });
    } catch (error) {
      console.error('Failed to report history to backend:', error);
    }
  };

  const playTrack = (track: ITrack, newQueue?: ITrack[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      setOriginalQueue(newQueue);
      
      // Find the clicked track index in the new queue
      const idx = newQueue.findIndex(t => t.videoId === track.videoId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      // Clear existing queue and start fresh with just this track
      setQueue([track]);
      setOriginalQueue([track]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    
    if (isLooping) {
      // Seek to beginning if loop mode is single
      playerRef.current?.seekTo(0);
      setCurrentTime(0);
      setProgress(0);
      return;
    }

    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (autoplayEnabled && autoplayTracks.length > 0) {
      // Get the first track from autoplay recommendations
      const nextAutoTrack = autoplayTracks[0];
      
      // Append to the queue
      const updatedQueue = [...queue, nextAutoTrack];
      setQueue(updatedQueue);
      setOriginalQueue([...originalQueue, nextAutoTrack]);
      
      // Play the newly appended track
      setCurrentIndex(updatedQueue.length - 1);
      
      // Remove consumed track from autoplayTracks
      setAutoplayTracks(prev => prev.slice(1));
    } else if (autoplayEnabled) {
      // End of queue — autoplay is on but tracks not loaded yet
      // Flag so we auto-play when recommendations arrive
      _pendingAutoPlayRef.current = true;
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    } else {
      // End of queue — autoplay disabled, stop cleanly
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0) return;
    
    // If we've played > 3 seconds, previous track button resets current track first
    if (currentTime > 3) {
      playerRef.current?.seekTo(0);
      setCurrentTime(0);
      setProgress(0);
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Loop back to end of queue
      setCurrentIndex(queue.length - 1);
    }
  };

  const seekTo = (progressPercent: number) => {
    if (!currentTrack) return;
    const targetSeconds = (progressPercent / 100) * duration;
    playerRef.current?.seekTo(targetSeconds);
    setCurrentTime(targetSeconds);
    setProgress(progressPercent);
  };

  const adjustVolume = (vol: number) => {
    setVolume(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const toggleShuffle = () => {
    const nextShuffle = !isShuffled;
    setIsShuffled(nextShuffle);

    if (nextShuffle && currentTrack) {
      // Shuffle the queue, keeping current track at index 0
      const remainingTracks = queue.filter((_, idx) => idx !== currentIndex);
      const shuffled = [...remainingTracks].sort(() => Math.random() - 0.5);
      setQueue([currentTrack, ...shuffled]);
      setCurrentIndex(0);
    } else if (currentTrack) {
      // Restore original queue order, finding the current track's index in the original queue
      const origIndex = originalQueue.findIndex(t => t.videoId === currentTrack.videoId);
      setQueue(originalQueue);
      setCurrentIndex(origIndex >= 0 ? origIndex : 0);
    }
  };

  const addToQueue = (track: ITrack) => {
    const updated = [...queue, track];
    setQueue(updated);
    setOriginalQueue([...originalQueue, track]);
    if (queue.length === 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };

  const playNext = (track: ITrack) => {
    if (queue.length === 0) {
      setQueue([track]);
      setOriginalQueue([track]);
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }
    
    // Insert after current index
    const updated = [...queue];
    
    // If the track is already in the queue, remove it first
    const existingIdx = updated.findIndex(t => t.videoId === track.videoId);
    if (existingIdx >= 0) {
      updated.splice(existingIdx, 1);
    }
    
    const insertIdx = currentIndex + 1;
    updated.splice(insertIdx, 0, track);
    setQueue(updated);
    setOriginalQueue(updated);
  };

  const removeFromQueue = (index: number) => {
    if (index === currentIndex) {
      nextTrack();
    }
    
    const updated = queue.filter((_, idx) => idx !== index);
    setQueue(updated);
    
    // Adjust current index if we removed a preceding item
    if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setOriginalQueue([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const toggleAutoplay = () => {
    setAutoplayEnabled(prev => {
      const nextVal = !prev;
      localStorage.setItem('yt_music_autoplay_enabled', String(nextVal));
      return nextVal;
    });
  };

  // Fetch autoplay recommendations when current track or queue changes (with 800ms debounce to optimize data usage and speed)
  useEffect(() => {
    if (autoplayEnabled && currentTrack) {
      // Exclude remaining manual queue tracks to avoid duplicate suggestions
      const remainingQueueIds = queue.slice(currentIndex + 1).map(t => t.videoId);
      
      const controller = new AbortController();
      const runFetch = async () => {
        setIsAutoplayLoading(true);
        try {
          const autoHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-user-id': userId
          };
          if (token) autoHeaders['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`${BACKEND_URL}/recommendations/autoplay`, {
            method: 'POST',
            headers: autoHeaders,
            signal: controller.signal,
            body: JSON.stringify({
              videoId: currentTrack.videoId,
              artist: currentTrack.artist,
              currentQueueIds: remainingQueueIds
            })
          });
          if (res.ok) {
            const data = await res.json();
            setAutoplayTracks(data);
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch autoplay recommendations:', err);
          }
        } finally {
          setIsAutoplayLoading(false);
        }
      };

      const debounceTimer = setTimeout(() => {
        runFetch();
      }, 800);

      return () => {
        clearTimeout(debounceTimer);
        controller.abort();
      };
    } else {
      setAutoplayTracks([]);
    }
  }, [currentTrack?.videoId, autoplayEnabled, queue.length, currentIndex, userId]);

  // Auto-advance when autoplay recommendations arrive after queue ended
  useEffect(() => {
    if (_pendingAutoPlayRef.current && autoplayTracks.length > 0) {
      _pendingAutoPlayRef.current = false;
      nextTrack();
    }
  }, [autoplayTracks]);

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
    setProgress(state.played * 100);
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        progress,
        volume,
        isMuted,
        isLooping,
        isShuffled,
        queue,
        currentIndex,
        userId,
        autoplayEnabled,
        autoplayTracks,
        isAutoplayLoading,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        adjustVolume,
        toggleMute,
        toggleLoop,
        toggleShuffle,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        toggleAutoplay
      }}
    >
      {children}

      {/* Hidden ReactPlayer to stream audio only */}
      {currentTrack && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${currentTrack.videoId}`}
            playing={isPlaying}
            volume={isMuted ? 0 : volume}
            loop={isLooping}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={nextTrack}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3
                }
              }
            }}
          />
        </div>
      )}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
