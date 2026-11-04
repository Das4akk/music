import { Track, TrackSource } from '../../../src/types/music.js';
import { detectVersion } from '../../../src/utils/searchEngine.js';

interface ItunesRawItem {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  releaseDate?: string;
  trackViewUrl?: string;
  previewUrl?: string;
}

export class AppleMusicAdapter {
  readonly platform = 'apple' as const;

  async search(query: string, limit = 15): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=${limit}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

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

      const json = (await res.json()) as { results?: ItunesRawItem[] };
      if (!json.results || !Array.isArray(json.results)) {
        return [];
      }

      return json.results.map(item => this.mapToTrack(item));
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapToTrack(item: ItunesRawItem): Track {
    const artwork =
      (item.artworkUrl100 || '').replace('100x100bb', '600x600bb') ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const fullDurationSec = Math.round((item.trackTimeMillis || 0) / 1000) || 180;
    const hasStream = Boolean(item.previewUrl && item.previewUrl.startsWith('http'));
    const queryTerm = encodeURIComponent(`${item.artistName} ${item.trackName || ''}`);

    const sources: TrackSource[] = [
      {
        platform: 'apple',
        id: String(item.trackId),
        url: item.trackViewUrl || `https://music.apple.com`,
        available: true,
        previewUrl: item.previewUrl,
        quality: 'Apple Music Official',
      },
      {
        platform: 'spotify',
        id: `sp_query_${item.trackId}`,
        url: `https://open.spotify.com/search/${queryTerm}`,
        available: true,
      },
      {
        platform: 'deezer',
        id: `dz_query_${item.trackId}`,
        url: `https://www.deezer.com/search/${queryTerm}`,
        available: true,
      },
      {
        platform: 'youtube',
        id: `yt_query_${item.trackId}`,
        url: `https://music.youtube.com/search?q=${queryTerm}`,
        available: true,
      },
      {
        platform: 'soundcloud',
        id: `sc_query_${item.trackId}`,
        url: `https://soundcloud.com/search?q=${queryTerm}`,
        available: true,
      },
      {
        platform: 'audiomack',
        id: `am_query_${item.trackId}`,
        url: `https://audiomack.com/search?q=${queryTerm}`,
        available: true,
      },
      {
        platform: 'bandcamp',
        id: `bc_query_${item.trackId}`,
        url: `https://bandcamp.com/search?q=${queryTerm}`,
        available: true,
      },
    ];

    return {
      id: `ap_${item.trackId}`,
      title: item.trackName || 'Untitled',
      artist: item.artistName || 'Unknown Artist',
      featuredArtists: [],
      album: item.collectionName || '',
      artworkUrl: artwork,
      // Honest duration: if it is a 30s preview, playable duration is 30s
      duration: hasStream ? 30 : fullDurationSec,
      originalDuration: fullDurationSec,
      releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : undefined,
      genre: item.primaryGenreName || 'Music',
      versionType: detectVersion(item.trackName || ''),
      playback: {
        isStreamable: hasStream,
        streamType: hasStream ? 'preview' : 'external',
        streamUrl: item.previewUrl || '',
        mimeType: hasStream ? 'audio/x-m4a' : undefined,
        previewDuration: hasStream ? 30 : undefined,
        source: 'apple',
        quality: hasStream ? '30с. Превью (AAC)' : 'Внешний источник',
        externalUrl: item.trackViewUrl || `https://music.apple.com`,
      },
      sources,
      lyrics: {
        isSynced: false,
        lines: [],
      },
    };
  }
}
