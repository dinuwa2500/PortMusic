import https from 'https';

export interface ISong {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  views: string;
}

// Persistent HTTPS Agent with keepAlive enabled to reduce handshake overhead
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 25,
  keepAliveMsecs: 1000
});

// Cache interface for scraped related videos
interface ICacheEntry {
  songs: ISong[];
  expiry: number;
}

const relatedCache = new Map<string, ICacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to make HTTPS GET requests and return body as string
const fetchUrl = (url: string, headers: Record<string, string> = {}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const options = {
      agent: keepAliveAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        ...headers
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Recursive helper to find all objects containing a specific key inside nested JSON
const findNestedObjects = (obj: any, keyName: string, list: any[] = []): any[] => {
  if (!obj || typeof obj !== 'object') return list;
  
  if (obj[keyName]) {
    list.push(obj[keyName]);
  }
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      findNestedObjects(obj[key], keyName, list);
    }
  }
  return list;
};

export const searchYouTube = async (query: string): Promise<ISong[]> => {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const html = await fetchUrl(url, { 'Accept-Language': 'en-US,en;q=0.9' });
    
    const regex = /ytInitialData\s*=\s*({[\s\S]+?});/;
    const match = html.match(regex);
    
    if (!match) {
      console.warn("Could not find ytInitialData in YouTube search response");
      return [];
    }

    const data = JSON.parse(match[1]);
    const songs: ISong[] = [];
    const seenIds = new Set<string>();

    // Recursively find all videoRenderer items in search results
    const videoRenderers = findNestedObjects(data, 'videoRenderer');

    for (const video of videoRenderers) {
      const videoId = video.videoId;
      if (!videoId || seenIds.has(videoId)) continue;

      const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Unknown Title';
      const artist = video.ownerText?.runs?.[0]?.text || video.shortBylineText?.runs?.[0]?.text || 'Unknown Artist';
      const duration = video.lengthText?.simpleText || '0:00';
      const views = video.viewCountText?.simpleText || video.viewCountText?.runs?.[0]?.text || '0 views';
      
      const thumbnails = video.thumbnail?.thumbnails;
      const thumbnail = (thumbnails && thumbnails.length > 0)
        ? thumbnails[thumbnails.length - 1].url
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      seenIds.add(videoId);
      songs.push({
        videoId,
        title,
        artist,
        thumbnail,
        duration,
        views
      });
    }

    return songs;
  } catch (error) {
    console.error('Error scraping YouTube search:', error);
    return [];
  }
};

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const responseText = await fetchUrl(url);
    const data = JSON.parse(responseText);
    
    if (Array.isArray(data) && data.length >= 2 && Array.isArray(data[1])) {
      return data[1];
    }
    return [];
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    return [];
  }
};

export const getRelatedVideos = async (videoId: string, fallbackArtist?: string): Promise<ISong[]> => {
  // Check in-memory cache first
  const cached = relatedCache.get(videoId);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    console.log(`[Cache Hit] Autoplay recommendations returned from in-memory cache for video: ${videoId}`);
    return cached.songs;
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const html = await fetchUrl(url, { 'Accept-Language': 'en-US,en;q=0.9' });
    const regex = /ytInitialData\s*=\s*({[\s\S]+?});/;
    const match = html.match(regex);
    
    if (!match) {
      console.warn(`Could not find ytInitialData in watch response for video ${videoId}, trying fallback`);
      if (fallbackArtist) {
        return await searchYouTube(fallbackArtist);
      }
      return [];
    }

    const data = JSON.parse(match[1]);
    const songs: ISong[] = [];
    const seenIds = new Set<string>();

    // Recursively find all compactVideoRenderer items in the watch page recommendations
    const compactVideoRenderers = findNestedObjects(data, 'compactVideoRenderer');

    for (const video of compactVideoRenderers) {
      const vId = video.videoId;
      if (!vId || seenIds.has(vId)) continue;

      const title = video.title?.simpleText || video.title?.runs?.[0]?.text || 'Unknown Title';
      const artist = video.shortBylineText?.runs?.[0]?.text || video.longBylineText?.runs?.[0]?.text || 'Unknown Artist';
      const duration = video.lengthText?.simpleText || '0:00';
      const views = video.viewCountText?.simpleText || video.viewCountText?.runs?.[0]?.text || '0 views';
      
      const thumbnails = video.thumbnail?.thumbnails;
      const thumbnail = (thumbnails && thumbnails.length > 0)
        ? thumbnails[thumbnails.length - 1].url
        : `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

      seenIds.add(vId);
      songs.push({
        videoId: vId,
        title,
        artist,
        thumbnail,
        duration,
        views
      });
    }

    if (songs.length === 0) {
      if (fallbackArtist) {
        console.log(`No compactVideoRenderer results found for video ${videoId}, trying fallback search for artist: ${fallbackArtist}`);
        const fallbackSongs = await searchYouTube(fallbackArtist);
        return fallbackSongs;
      }
      return [];
    }

    // Cache successful scraped results
    relatedCache.set(videoId, {
      songs,
      expiry: now + CACHE_TTL_MS
    });

    return songs;
  } catch (error) {
    console.error(`Error fetching related videos for video ${videoId}:`, error);
    if (fallbackArtist) {
      return await searchYouTube(fallbackArtist);
    }
    return [];
  }
};
