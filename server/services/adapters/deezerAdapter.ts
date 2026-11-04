import { Track, TrackSource } from '../../../src/types/music.js';
import { detectVersion } from '../../../src/utils/searchEngine.js';

interface DeezerRawItem {
  id: number;
  title: string;
  title_short?: string;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_xl?: string; cover_big?: string; cover_medium?: string };
  duration: number;
  isrc?: string;
  link: string;
  preview?: string;
  explicit_lyrics?: boolean;
}

interface DeezerArtistItem {
  id: number;
  name: string;
  picture_medium?: string;
  tracklist?: string;
}

export class DeezerAdapter {
  readonly platform = 'deezer' as const;

  async search(query: string, limit = 15): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const isArtistSearch = !trimmed.includes('-') && !trimmed.includes('—') && trimmed.length >= 3;

      const promises: [Promise<Response>, Promise<Response | null>] = [
        fetch(`https://api.deezer.com/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'AetheriaMusic/1.0', Accept: 'application/json' },
        }),
        isArtistSearch
          ? fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(trimmed)}&limit=1`, {
              signal: controller.signal,
              headers: { 'User-Agent': 'AetheriaMusic/1.0', Accept: 'application/json' },
            }).catch(() => null)
          : Promise.resolve(null),
      ];

      const [trackRes, artistRes] = await Promise.all(promises);

      const collected: DeezerRawItem[] = [];

      // 1. Process verified artist top tracks if query matches an artist name
      if (artistRes && artistRes.ok) {
        try {
          const artistJson = (await artistRes.json()) as { data?: DeezerArtistItem[] };
          const topArtist = artistJson.data?.[0];
          if (topArtist) {
            const artistNameLower = topArtist.name.toLowerCase();
            const queryLower = trimmed.toLowerCase();
            if (artistNameLower === queryLower || artistNameLower.includes(queryLower) || queryLower.includes(artistNameLower)) {
              const topTracksRes = await fetch(`https://api.deezer.com/artist/${topArtist.id}/top?limit=10`, {
                signal: controller.signal,
                headers: { 'User-Agent': 'AetheriaMusic/1.0', Accept: 'application/json' },
              });
              if (topTracksRes.ok) {
                const topJson = (await topTracksRes.json()) as { data?: DeezerRawItem[] };
                if (topJson.data && Array.isArray(topJson.data)) {
                  collected.push(...topJson.data);
                }
              }
            }
          }
        } catch {
          // ignore artist subquery error
        }
      }

      // 2. Process general search results
      if (trackRes.ok) {
        const json = (await trackRes.json()) as { data?: DeezerRawItem[] };
        if (json.data && Array.isArray(json.data)) {
          for (const item of json.data) {
            if (!collected.some(existing => existing.id === item.id)) {
              collected.push(item);
            }
          }
        }
      }

      return collected.map(item => this.mapToTrack(item));
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapToTrack(item: DeezerRawItem): Track {
    const artwork =
      item.album?.cover_xl ||
      item.album?.cover_big ||
      item.album?.cover_medium ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const hasStream = Boolean(item.preview && item.preview.startsWith('http'));
    const fullDuration = item.duration || 180;
    const queryTerm = encodeURIComponent(`${item.artist?.name || ''} ${item.title}`);

    const sources: TrackSource[] = [
      {
        platform: 'deezer',
        id: String(item.id),
        url: item.link || `https://www.deezer.com/track/${item.id}`,
        available: true,
        previewUrl: item.preview,
        quality: 'Deezer Official',
      },
      {
        platform: 'spotify',
        id: `sp_query_${item.id}`,
        url: `https://open.spotify.com/search/${queryTerm}`,
        available: true,
      },
      {
        platform: 'apple',
        id: `ap_query_${item.id}`,
        url: `https://music.apple.com/search?term=${queryTerm}`,
        available: true,
      },
      {
        platform: 'youtube',
        id: `yt_query_${item.id}`,
        url: `https://music.youtube.com/search?q=${queryTerm}`,
        available: true,
      },
      {
        platform: 'soundcloud',
        id: `sc_query_${item.id}`,
        url: `https://soundcloud.com/search?q=${queryTerm}`,
        available: true,
      },
      {
        platform: 'audiomack',
        id: `am_query_${item.id}`,
        url: `https://audiomack.com/search?q=${queryTerm}`,
        available: true,
      },
      {
        platform: 'bandcamp',
        id: `bc_query_${item.id}`,
        url: `https://bandcamp.com/search?q=${queryTerm}`,
        available: true,
      },
    ];

    return {
      id: `dz_${item.id}`,
      title: item.title,
      artist: item.artist?.name || 'Unknown Artist',
      featuredArtists: [],
      album: item.album?.title || '',
      artworkUrl: artwork,
      // Honest duration: if it is a 30s preview, playable duration is 30s!
      duration: hasStream ? 30 : fullDuration,
      originalDuration: fullDuration,
      genre: 'General',
      isrc: item.isrc,
      versionType: detectVersion(item.title),
      playback: {
        isStreamable: hasStream,
        streamType: hasStream ? 'preview' : 'external',
        streamUrl: item.preview || '',
        mimeType: hasStream ? 'audio/mpeg' : undefined,
        previewDuration: hasStream ? 30 : undefined,
        source: 'deezer',
        quality: hasStream ? '30с. Превью (128kbps)' : 'Внешний источник',
        externalUrl: item.link || `https://www.deezer.com/track/${item.id}`,
      },
      sources,
      lyrics: {
        isSynced: false,
        lines: [],
      },
    };
  }
}
