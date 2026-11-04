export type VersionType =
  | 'original'
  | 'slowed'
  | 'sped_up'
  | 'remix'
  | 'instrumental'
  | 'acoustic'
  | 'live'
  | 'extended'
  | 'radio_edit'
  | 'remastered'
  | 'demo';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface TrackSource {
  platform: 'deezer' | 'apple' | 'spotify' | 'youtube' | 'soundcloud' | 'audiomack' | 'jamendo' | 'free_archive' | 'bandcamp' | 'audius';
  id: string;
  url: string;
  available: boolean;
  previewUrl?: string;
  quality?: string;
}

export type PlayerStatus =
  | 'idle'
  | 'loading'
  | 'connecting'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error'
  | 'preview_ended';

export interface Track {
  id: string;
  title: string;
  artist: string;
  featuredArtists: string[];
  album: string;
  artworkUrl: string;
  duration: number; // in seconds (actual playable duration: e.g. 30s for preview or full for full track)
  originalDuration?: number; // full duration of track on the album
  releaseDate?: string;
  genre?: string;
  isrc?: string;
  versionType: VersionType;
  playback: {
    isStreamable: boolean;
    streamType: 'full' | 'preview' | 'external';
    streamUrl: string; // The validated audio stream URL (never an image or webpage)
    mimeType?: string; // e.g. 'audio/mpeg', 'audio/mp4', 'audio/aac'
    previewDuration?: number; // 30s if preview
    source: TrackSource['platform'];
    quality: string;
    externalUrl: string; // Official platform webpage URL (Spotify, Apple, Deezer)
    expiresAt?: number; // Expiration timestamp in ms for tokenized previews
  };
  sources: TrackSource[];
  lyrics?: {
    isSynced: boolean;
    lines: LyricLine[];
    plain?: string;
    provider?: string;
  };
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  createdAt: string;
  isDefault?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  genre: string;
  monthlyListeners?: number;
  popularTracks: Track[];
  albums: Album[];
  bio?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  releaseYear: number;
  tracks: Track[];
  genre: string;
}

export interface UserSettings {
  audioQuality: 'auto' | 'lossless' | 'high' | 'normal';
  crossfadeSeconds: number;
  showVisualizer: boolean;
  enableAmbientParticles: boolean;
  lyricsFontSize: 'medium' | 'large' | 'xl';
  volume: number;
  isMuted: boolean;
  themeGraphiteTone: 'deep-charcoal' | 'pitch-black' | 'midnight-slate';
}

export interface SearchFilter {
  query: string;
  platform?: string;
  version?: string;
  genre?: string;
  onlyStreamable?: boolean;
}
