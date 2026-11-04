import { Track, SearchFilter } from '../../src/types/music.js';
import { deduplicateAndRank, normalizeQuery } from '../../src/utils/searchEngine.js';
import { DeezerAdapter } from './adapters/deezerAdapter.js';
import { AppleMusicAdapter } from './adapters/appleMusicAdapter.js';
import { AudiusAdapter } from './adapters/audiusAdapter.js';

interface CacheEntry {
  data: Track[];
  timestamp: number;
}

export class MusicSearchService {
  private deezerAdapter = new DeezerAdapter();
  private appleAdapter = new AppleMusicAdapter();
  private audiusAdapter = new AudiusAdapter();
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

  async search(filter: SearchFilter): Promise<{
    query: string;
    total: number;
    tracks: Track[];
    sourcesQueried: string[];
    fromCache: boolean;
  }> {
    const rawQuery = filter.query.trim();
    if (!rawQuery) {
      return {
        query: '',
        total: 0,
        tracks: [],
        sourcesQueried: [],
        fromCache: false,
      };
    }

    const { cleanQuery } = normalizeQuery(rawQuery);
    const cacheKey = `search:${cleanQuery.toLowerCase()}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      let filtered = cached.data;
      if (filter.version && filter.version !== 'all') {
        filtered = filtered.filter(t => t.versionType === filter.version);
      }
      if (filter.onlyStreamable) {
        filtered = filtered.filter(t => t.playback.isStreamable);
      }
      if (filter.platform && filter.platform !== 'all') {
        filtered = filtered.filter(t => t.sources.some(s => s.platform === filter.platform));
      }

      return {
        query: rawQuery,
        total: filtered.length,
        tracks: filtered,
        sourcesQueried: ['audius', 'deezer', 'apple'],
        fromCache: true,
      };
    }

    // Parallel multi-source dispatch prioritizing open full streams alongside catalog metadata
    const [audiusResult, deezerResult, appleResult] = await Promise.allSettled([
      this.audiusAdapter.search(cleanQuery, 15),
      this.deezerAdapter.search(cleanQuery, 12),
      this.appleAdapter.search(cleanQuery, 12),
    ]);

    const collectedTracks: Track[] = [];
    const sourcesQueried: string[] = [];

    if (audiusResult.status === 'fulfilled' && audiusResult.value.length > 0) {
      collectedTracks.push(...audiusResult.value);
      sourcesQueried.push('audius');
    }
    if (deezerResult.status === 'fulfilled' && deezerResult.value.length > 0) {
      collectedTracks.push(...deezerResult.value);
      sourcesQueried.push('deezer');
    }
    if (appleResult.status === 'fulfilled' && appleResult.value.length > 0) {
      collectedTracks.push(...appleResult.value);
      sourcesQueried.push('apple');
    }

    // Unified deduplication, source merging and relevance ranking
    // Full tracks are scored higher and merged with metadata from other platforms
    const unifiedTracks = deduplicateAndRank(collectedTracks, cleanQuery);

    // Save in cache
    this.cache.set(cacheKey, {
      data: unifiedTracks,
      timestamp: now,
    });

    // Cleanup old cache entries periodically
    if (this.cache.size > 200) {
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.CACHE_TTL_MS) {
          this.cache.delete(key);
        }
      }
    }

    let finalTracks = unifiedTracks;
    if (filter.version && filter.version !== 'all') {
      finalTracks = finalTracks.filter(t => t.versionType === filter.version);
    }
    if (filter.onlyStreamable) {
      finalTracks = finalTracks.filter(t => t.playback.isStreamable);
    }
    if (filter.platform && filter.platform !== 'all') {
      finalTracks = finalTracks.filter(t => t.sources.some(s => s.platform === filter.platform));
    }

    return {
      query: rawQuery,
      total: finalTracks.length,
      tracks: finalTracks,
      sourcesQueried,
      fromCache: false,
    };
  }

  getTrackById(id: string): Track | undefined {
    // Check cached searches
    for (const entry of this.cache.values()) {
      const found = entry.data.find(t => t.id === id);
      if (found) return found;
    }
    return undefined;
  }
}
