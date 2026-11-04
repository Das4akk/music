import { Track } from '../../../src/types/music.js';
import { detectVersion } from '../../../src/utils/searchEngine.js';

interface AudiusRawTrack {
  id: string;
  track_id: number;
  title: string;
  duration: number;
  user: {
    id: string;
    name: string;
    handle: string;
  };
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  is_streamable?: boolean;
  genre?: string;
}

export class AudiusAdapter {
  readonly platform = 'audius' as const;

  async search(query: string, limit = 15): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(trimmed)}&limit=${limit}&app_name=aetheriamusic`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AetheriaMusic/1.0',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        return [];
      }

      const json = (await res.json()) as { data?: AudiusRawTrack[] };
      if (!json.data || !Array.isArray(json.data)) {
        return [];
      }

      return json.data
        .filter(t => t.duration > 15 && t.title && t.user?.name)
        .map(t => this.mapToTrack(t));
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapToTrack(item: AudiusRawTrack): Track {
    const artwork =
      item.artwork?.['480x480'] ||
      item.artwork?.['1000x1000'] ||
      item.artwork?.['150x150'] ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const fullDuration = Math.round(item.duration) || 180;
    const trackIdentifier = item.track_id || item.id;
    const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${trackIdentifier}/stream?app_name=aetheriamusic`;

    return {
      id: `aud_${trackIdentifier}`,
      title: item.title,
      artist: item.user.name,
      featuredArtists: [],
      album: 'Audius Catalog',
      artworkUrl: artwork,
      duration: fullDuration,
      originalDuration: fullDuration,
      genre: item.genre || 'Electronic',
      versionType: detectVersion(item.title),
      playback: {
        isStreamable: true,
        streamType: 'full', // Full-length audio stream!
        streamUrl,
        source: 'audius',
        quality: '320kbps MP3 (Full)',
        externalUrl: `https://audius.co/${item.user.handle}/${encodeURIComponent(item.title)}`,
      },
      sources: [
        {
          platform: 'audius',
          id: String(trackIdentifier),
          url: `https://audius.co/${item.user.handle}`,
          available: true,
          quality: 'Audius Full Stream',
        },
        {
          platform: 'spotify',
          id: `sp_aud_${trackIdentifier}`,
          url: `https://open.spotify.com/search/${encodeURIComponent(`${item.user.name} ${item.title}`)}`,
          available: true,
        },
        {
          platform: 'apple',
          id: `ap_aud_${trackIdentifier}`,
          url: `https://music.apple.com/search?term=${encodeURIComponent(`${item.user.name} ${item.title}`)}`,
          available: true,
        },
        {
          platform: 'youtube',
          id: `yt_aud_${trackIdentifier}`,
          url: `https://music.youtube.com/search?q=${encodeURIComponent(`${item.user.name} ${item.title}`)}`,
          available: true,
        },
        {
          platform: 'deezer',
          id: `dz_aud_${trackIdentifier}`,
          url: `https://www.deezer.com/search/${encodeURIComponent(`${item.user.name} ${item.title}`)}`,
          available: true,
        },
      ],
      lyrics: {
        isSynced: false,
        lines: [],
      },
    };
  }
}
