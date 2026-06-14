import { Request, Response } from 'express';
import HistoryModel from '../models/History.js';
import FavoriteModel from '../models/Favorite.js';
import { getRelatedVideos, searchYouTube } from '../utils/ytScraper.js';

// Normalizes and cleans artist name to improve matching rate safely
const normalizeArtist = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*feat\..*$/i, '')
    .replace(/\s*ft\..*$/i, '')
    .replace(/\s*&\s*/g, ' ')
    .replace(/\s*prod\..*$/i, '')
    .trim();
};

// Extracts style keywords/tags from title safely
const extractVibeTags = (title: string): string[] => {
  const tags: string[] = [];
  if (!title) return tags;
  const lowerTitle = title.toLowerCase();
  
  const keywords = ['acoustic', 'live', 'remix', 'lofi', 'slowed', 'reverb', 'cover', 'instrumental', 'clean', 'explicit'];
  keywords.forEach(word => {
    if (lowerTitle.includes(word)) {
      tags.push(word);
    }
  });
  return tags;
};

export const getAutoplayRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const { videoId, artist, currentQueueIds } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // 1. Fetch user's play history and favorites (optimized limits and projections)
    const [history, favorites] = await Promise.all([
      HistoryModel.find({ userId })
        .select('videoId title artist thumbnail duration plays playedAt')
        .sort({ playedAt: -1 })
        .limit(30),
      FavoriteModel.find({ userId })
        .select('videoId title artist thumbnail duration')
    ]);

    // Get current track details from history if available
    const currentTrackFromHistory = history.find(h => h.videoId === videoId);
    const activeTitle = currentTrackFromHistory?.title || '';
    const activeVibeTags = extractVibeTags(activeTitle);

    // 2. Compute user profile weights
    const artistPreferenceMap = new Map<string, number>();
    
    // Favorites get solid base weight
    favorites.forEach(fav => {
      const norm = normalizeArtist(fav.artist);
      if (norm) {
        artistPreferenceMap.set(norm, (artistPreferenceMap.get(norm) || 0) + 10);
      }
    });

    // History gets weighted by recency and play counts
    history.forEach((hist, index) => {
      const norm = normalizeArtist(hist.artist);
      if (norm) {
        const recencyWeight = Math.max(0, 12 - index * 0.4);
        const playWeight = hist.plays * 2.5;
        artistPreferenceMap.set(norm, (artistPreferenceMap.get(norm) || 0) + playWeight + recencyWeight);
      }
    });

    // Find top 3 recent favorite artists for general targeting
    const topRecentArtists = Array.from(artistPreferenceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    const favoriteVideoIds = new Set(favorites.map(f => f.videoId));
    const historyPlaysMap = new Map<string, number>();
    history.forEach(h => {
      historyPlaysMap.set(h.videoId, h.plays);
    });

    // 3. Exclusions
    const excludedIds = new Set<string>();
    excludedIds.add(videoId);
    if (Array.isArray(currentQueueIds)) {
      currentQueueIds.forEach(id => excludedIds.add(id));
    }

    // 4. Multi-Channel Candidate Retrieval (YT Music Mix Engine)
    const normalizedActiveArtist = normalizeArtist(artist);
    
    const [primaryRelated, secondaryRelated, activeArtistPopular, topArtistPopular] = await Promise.all([
      // Channel A: Active video's watch related suggestions (primary seed)
      getRelatedVideos(videoId, artist || ''),
      
      // Channel B: Previous video's suggestions (listen flow continuity seed)
      (() => {
        const lastPlayed = history.find(h => h.videoId !== videoId);
        return lastPlayed ? getRelatedVideos(lastPlayed.videoId, lastPlayed.artist || '') : Promise.resolve([]);
      })(),

      // Channel C: Other popular tracks by the SAME artist as the active track (Discography mixing)
      artist ? searchYouTube(`${artist} popular songs`) : Promise.resolve([]),

      // Channel D: Popular tracks of the user's top recent favorite artist (Profile matching)
      (() => {
        return topRecentArtists.length > 0
          ? searchYouTube(`${topRecentArtists[0]} popular tracks`)
          : Promise.resolve([]);
      })()
    ]);

    // Merge candidates and track source information
    const candidatesMap = new Map<string, { song: any; score: number }>();
    
    const addCandidates = (tracks: any[], baseScore: number) => {
      if (!Array.isArray(tracks)) return;
      tracks.forEach((song, idx) => {
        if (!song || !song.videoId || excludedIds.has(song.videoId)) return;
        
        // Base score decays down the list to favor top results
        const decayScore = baseScore - idx * 2.0;
        
        if (candidatesMap.has(song.videoId)) {
          const existing = candidatesMap.get(song.videoId)!;
          existing.score = Math.max(existing.score, decayScore) + 15;
        } else {
          candidatesMap.set(song.videoId, { song, score: decayScore });
        }
      });
    };

    addCandidates(primaryRelated, 100);
    addCandidates(secondaryRelated, 85);
    addCandidates(activeArtistPopular, 80);
    addCandidates(topArtistPopular, 75);

    // 5. Advanced Re-ranking & Context Matching (The YouTube Music Ranker)
    const candidates = Array.from(candidatesMap.values());

    const scoredCandidates = candidates.map(item => {
      const { song } = item;
      let score = item.score;
      const normArtist = normalizeArtist(song.artist);

      // A. Graded Recency Fatigue Penalty
      const historyIndex = history.findIndex(h => h.videoId === song.videoId);
      if (historyIndex !== -1) {
        if (historyIndex < 3) {
          score -= 90;
        } else if (historyIndex < 8) {
          score -= 45;
        } else if (historyIndex < 20) {
          score -= 20;
        } else {
          score += 10;
        }
      }

      // B. User Listening Taste Boost (Artist Prefs)
      const artistPreferenceScore = artistPreferenceMap.get(normArtist) || 0;
      score += artistPreferenceScore * 1.8;

      // C. Active Artist Discography spacing
      if (normArtist && normArtist === normalizedActiveArtist) {
        score += 15;
      }

      // D. Vibe & Style Keyword Matching
      const candidateVibeTags = extractVibeTags(song.title);
      const matchingTags = candidateVibeTags.filter(t => activeVibeTags.includes(t));
      if (matchingTags.length > 0) {
        score += matchingTags.length * 20;
      }

      // E. Favorite Track Boost
      if (favoriteVideoIds.has(song.videoId)) {
        score += 35;
      }

      // F. Play Frequency Boost
      const plays = historyPlaysMap.get(song.videoId) || 0;
      score += plays * 4.0;

      // G. Freshness Randomizer
      score += (Math.random() - 0.5) * 8;

      return { song, score };
    });

    // Sort descending by calculated score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Apply Artist Diversity Spreading
    const finalFilteredSongs: any[] = [];
    const seenArtistsInFinal = new Map<string, number>();

    for (const item of scoredCandidates) {
      const song = item.song;
      const normArtist = normalizeArtist(song.artist);
      let adjustedScore = item.score;

      if (normArtist) {
        const artistCount = seenArtistsInFinal.get(normArtist) || 0;
        if (artistCount > 0) {
          adjustedScore -= artistCount * 25;
        }
        seenArtistsInFinal.set(normArtist, artistCount + 1);
      }

      finalFilteredSongs.push({ song, score: adjustedScore });
    }

    // Sort again by adjusted diversity score
    finalFilteredSongs.sort((a, b) => b.score - a.score);

    let finalSongs = finalFilteredSongs.map(item => item.song).slice(0, 15);

    // 6. Fallback block (search-based fallback if all scrapers return empty)
    if (finalSongs.length === 0) {
      console.log('Autoplay candidate pool empty. Querying search-based mix as fallback...');
      const fallbackQuery = artist ? `${artist} mix` : 'popular music mix';
      const fallbackSearch = await searchYouTube(fallbackQuery);
      const filteredSearch = fallbackSearch.filter(song => !excludedIds.has(song.videoId));
      
      if (filteredSearch.length > 0) {
        finalSongs = filteredSearch.slice(0, 15);
      }
    }

    // 7. Last Resort Database Fallback
    if (finalSongs.length === 0) {
      const fallbackSongs: any[] = [];
      const seenIds = new Set(excludedIds);

      for (const fav of favorites) {
        if (!seenIds.has(fav.videoId)) {
          fallbackSongs.push({
            videoId: fav.videoId,
            title: fav.title,
            artist: fav.artist,
            thumbnail: fav.thumbnail,
            duration: fav.duration,
            views: 'Popular'
          });
          seenIds.add(fav.videoId);
        }
      }

      for (const hist of history) {
        if (!seenIds.has(hist.videoId)) {
          fallbackSongs.push({
            videoId: hist.videoId,
            title: hist.title,
            artist: hist.artist,
            thumbnail: hist.thumbnail,
            duration: hist.duration,
            views: 'Recently Played'
          });
          seenIds.add(hist.videoId);
        }
      }

      finalSongs = fallbackSongs.slice(0, 15);
    }

    console.log(`[YT Music Recommendations] Loaded ${finalSongs.length} tracks (Vibe: [${activeVibeTags.join(', ')}])`);
    res.json(finalSongs);
  } catch (error) {
    console.error('Error getting autoplay recommendations:', error);
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
};
