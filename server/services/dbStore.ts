import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Playlist, Track, UserSettings } from '../../src/types/music.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE_PATH = path.resolve(__dirname, '../data/user_store.json');

export interface DbState {
  favorites: Track[];
  history: Array<{ track: Track; listenedAt: string }>;
  recentSearches: string[];
  playlists: Playlist[];
  settings: UserSettings;
}

const DEFAULT_STATE: DbState = {
  favorites: [],
  history: [],
  recentSearches: [],
  playlists: [],
  settings: {
    audioQuality: 'lossless',
    crossfadeSeconds: 2,
    showVisualizer: true,
    enableAmbientParticles: true,
    lyricsFontSize: 'large',
    volume: 0.85,
    isMuted: false,
    themeGraphiteTone: 'deep-charcoal',
  },
};

export class DbStore {
  private state: DbState;

  constructor() {
    this.state = this.loadFromFile();
  }

  private loadFromFile(): DbState {
    try {
      if (fs.existsSync(STORE_FILE_PATH)) {
        const raw = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<DbState>;
        return {
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          recentSearches: Array.isArray(parsed.recentSearches) ? parsed.recentSearches : [],
          playlists: Array.isArray(parsed.playlists) ? parsed.playlists : [],
          settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
        };
      }
    } catch (err) {
      console.warn('[DbStore] Failed to read store file, using clean state:', err);
    }
    return {
      favorites: [],
      history: [],
      recentSearches: [],
      playlists: [],
      settings: { ...DEFAULT_STATE.settings },
    };
  }

  private saveToFile(): void {
    try {
      const dir = path.dirname(STORE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DbStore] Failed to write store file:', err);
    }
  }

  getFavorites(): Track[] {
    return this.state.favorites;
  }

  isFavorite(trackId: string): boolean {
    return this.state.favorites.some(t => t.id === trackId);
  }

  toggleFavorite(track: Track): boolean {
    const idx = this.state.favorites.findIndex(t => t.id === track.id);
    let isNowFavorite = false;
    if (idx >= 0) {
      this.state.favorites.splice(idx, 1);
      isNowFavorite = false;
    } else {
      this.state.favorites.unshift(track);
      isNowFavorite = true;
    }
    this.saveToFile();
    return isNowFavorite;
  }

  getHistory(): Array<{ track: Track; listenedAt: string }> {
    return this.state.history;
  }

  addToHistory(track: Track): void {
    // Deduplicate consecutive plays of the same track
    this.state.history = this.state.history.filter(h => h.track.id !== track.id);
    this.state.history.unshift({
      track,
      listenedAt: new Date().toISOString(),
    });

    if (this.state.history.length > 50) {
      this.state.history.pop();
    }
    this.saveToFile();
  }

  getRecentSearches(): string[] {
    return this.state.recentSearches;
  }

  addRecentSearch(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return this.state.recentSearches;

    // Deduplicate case-insensitively
    this.state.recentSearches = this.state.recentSearches.filter(
      s => s.toLowerCase() !== trimmed.toLowerCase()
    );
    this.state.recentSearches.unshift(trimmed);

    if (this.state.recentSearches.length > 20) {
      this.state.recentSearches.pop();
    }
    this.saveToFile();
    return this.state.recentSearches;
  }

  clearRecentSearches(): void {
    this.state.recentSearches = [];
    this.saveToFile();
  }

  getPlaylists(): Playlist[] {
    return this.state.playlists;
  }

  getPlaylistById(id: string): Playlist | undefined {
    return this.state.playlists.find(p => p.id === id);
  }

  createPlaylist(title: string, description: string, coverUrl?: string): Playlist {
    const newPl: Playlist = {
      id: `pl_user_${Date.now()}`,
      title: title.trim() || 'Новый плейлист',
      description: description.trim() || 'Пользовательский плейлист',
      coverUrl:
        coverUrl ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      isDefault: false,
      tracks: [],
    };
    this.state.playlists.unshift(newPl);
    this.saveToFile();
    return newPl;
  }

  addTrackToPlaylist(playlistId: string, track: Track): boolean {
    const pl = this.getPlaylistById(playlistId);
    if (!pl) return false;
    if (!pl.tracks.some(t => t.id === track.id)) {
      pl.tracks.push(track);
      this.saveToFile();
      return true;
    }
    return false;
  }

  removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    const pl = this.getPlaylistById(playlistId);
    if (!pl) return false;
    pl.tracks = pl.tracks.filter(t => t.id !== trackId);
    this.saveToFile();
    return true;
  }

  deletePlaylist(playlistId: string): boolean {
    const pl = this.getPlaylistById(playlistId);
    if (!pl) return false;
    this.state.playlists = this.state.playlists.filter(p => p.id !== playlistId);
    this.saveToFile();
    return true;
  }

  getSettings(): UserSettings {
    return this.state.settings;
  }

  updateSettings(partial: Partial<UserSettings>): UserSettings {
    this.state.settings = { ...this.state.settings, ...partial };
    this.saveToFile();
    return this.state.settings;
  }
}
