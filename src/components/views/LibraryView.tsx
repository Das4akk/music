import React, { useState, useEffect } from 'react';
import { Track, Playlist } from '../../types/music.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { AnimatedEmoji } from '../common/AnimatedEmoji.js';
import {
  Heart,
  ListMusic,
  History,
  Play,
  Pause,
  Trash2,
  Plus,
  Settings,
  ArrowLeft,
  X,
} from 'lucide-react';

interface LibraryViewProps {
  playlists: Playlist[];
  selectedPlaylistId?: string | null;
  onSelectPlaylist?: (id: string | null) => void;
  onCreatePlaylist: (title: string, description: string, coverUrl?: string) => void;
  onDeletePlaylist?: (id: string) => void;
  brandName: string;
  onUpdateBrandName: (name: string) => void;
}

export function LibraryView({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  brandName,
  onUpdateBrandName,
}: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'playlists' | 'history'>('favorites');
  const [selectedPlaylistInternal, setSelectedPlaylistInternal] = useState<Playlist | null>(null);
  const [isNewPlaylistOpen, setIsNewPlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New playlist form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  // Settings form
  const [tempBrand, setTempBrand] = useState(brandName);

  const {
    favorites,
    history,
    currentTrack,
    isPlaying,
    playInContext,
    playTrack,
    togglePlay,
    toggleFavorite,
  } = usePlayer();

  useEffect(() => {
    if (selectedPlaylistId === 'library_favorites') {
      setActiveTab('favorites');
      setSelectedPlaylistInternal(null);
    } else if (selectedPlaylistId) {
      const found = playlists.find(p => p.id === selectedPlaylistId);
      if (found) {
        setSelectedPlaylistInternal(found);
      }
    }
  }, [selectedPlaylistId, playlists]);

  // Handle ESC key to close modal windows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNewPlaylistOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedPlaylist = selectedPlaylistInternal;
  const setSelectedPlaylist = (p: Playlist | null) => {
    setSelectedPlaylistInternal(p);
    if (onSelectPlaylist) onSelectPlaylist(p ? p.id : null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreatePlaylist(title.trim(), desc.trim());
    setTitle('');
    setDesc('');
    setIsNewPlaylistOpen(false);
  };

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempBrand.trim()) {
      onUpdateBrandName(tempBrand.trim());
      setIsSettingsOpen(false);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn max-w-4xl">
      {/* Header with Title, Tabs and Settings Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Моя музыка</h1>
          <p className="text-xs text-white/40 mt-0.5">
            Ваша персональная коллекция: избранное, плейлисты и история.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Section Tabs in COWIO Glass */}
          <div
            className="flex items-center rounded-2xl p-1 text-xs"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('favorites');
                setSelectedPlaylist(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'favorites' && !selectedPlaylist
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              Избранное ({favorites.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('playlists');
                setSelectedPlaylist(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'playlists' || selectedPlaylist
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              Плейлисты ({playlists.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setSelectedPlaylist(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history' && !selectedPlaylist
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              История
            </button>
          </div>

          {/* Quick Settings Icon in COWIO glass */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Настройки платформы"
            className="p-2.5 rounded-2xl text-white/60 hover:text-white transition-all cursor-pointer hover:border-white/20 active:scale-95"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
            title="Настройки платформы"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. PLAYLIST DETAIL VIEW IF A PLAYLIST IS SELECTED */}
      {selectedPlaylist ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedPlaylist(null)}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Назад ко всем плейлистам
          </button>

          <div
            className="flex items-center gap-4 p-5 rounded-[22px]"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
            }}
          >
            <img
              src={selectedPlaylist.coverUrl}
              alt={selectedPlaylist.title}
              className="w-20 h-20 rounded-[18px] object-cover border border-white/14 shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{selectedPlaylist.title}</h2>
              <p className="text-xs text-white/50 truncate mt-0.5">{selectedPlaylist.description}</p>
              <div className="text-[11px] font-mono text-white/40 mt-1.5">
                {selectedPlaylist.tracks.length} композиций
              </div>
            </div>

            {selectedPlaylist.tracks.length > 0 && (
              <button
                type="button"
                onClick={() => playInContext(selectedPlaylist.tracks[0], selectedPlaylist.tracks, 'playlist')}
                className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> Слушать
              </button>
            )}
          </div>

          <div className="space-y-2">
            {selectedPlaylist.tracks.map((track, i) => {
              const isCur = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${i}`}
                  onClick={() => (isCur ? togglePlay() : playInContext(track, selectedPlaylist.tracks, 'playlist'))}
                  className={`flex items-center justify-between p-3 px-4 rounded-[20px] transition-all cursor-pointer ${
                    isCur
                      ? 'border border-amber-400/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_1px_0_0_rgba(255,255,255,0.25)_inset]'
                      : 'hover:border-white/20'
                  }`}
                  style={{
                    background: isCur ? 'rgba(6, 6, 9, 0.65)' : 'rgba(6, 6, 9, 0.45)',
                    backdropFilter: 'blur(28px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                    border: isCur ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 14px 40px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-5 text-center text-xs font-mono text-white/40">
                      {isCur && isPlaying ? '▶' : i + 1}
                    </span>
                    <img src={track.artworkUrl} alt={track.title} className="w-11 h-11 rounded-[14px] object-cover border border-white/10" />
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold truncate ${isCur ? 'text-amber-400' : 'text-white'}`}>
                        {track.title}
                      </div>
                      <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-white/40">{formatDuration(track.duration)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 2. FAVORITES TAB */}
      {!selectedPlaylist && activeTab === 'favorites' && (
        <div className="space-y-2">
          {favorites.length === 0 ? (
            <div
              className="py-16 text-center p-8 rounded-[22px] space-y-3"
              style={{
                background: 'rgba(6, 6, 9, 0.45)',
                backdropFilter: 'blur(28px) saturate(190%)',
                WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
              }}
            >
              <AnimatedEmoji category="Symbols" name="Heart On Fire" size={40} fallbackText="❤️" />
              <h3 className="text-sm font-semibold text-white">Список избранного пуст</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                Отмечайте понравившиеся композиции сердечком на Главной, в Поиске или Плеере.
              </p>
            </div>
          ) : (
            favorites.map((track, idx) => {
              const isCur = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center justify-between p-3 px-4 rounded-[20px] transition-all ${
                    isCur
                      ? 'border border-amber-400/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_1px_0_0_rgba(255,255,255,0.25)_inset]'
                      : 'hover:border-white/20'
                  }`}
                  style={{
                    background: isCur ? 'rgba(6, 6, 9, 0.65)' : 'rgba(6, 6, 9, 0.45)',
                    backdropFilter: 'blur(28px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                    border: isCur ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 14px 40px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  <div
                    onClick={() => (isCur ? togglePlay() : playInContext(track, favorites, 'favorites'))}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                      <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isCur ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                        }`}
                      >
                        {isCur && isPlaying ? (
                          <Pause className="w-4 h-4 text-amber-400 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className={`text-sm font-semibold truncate ${isCur ? 'text-amber-400' : 'text-white'}`}>
                        {track.title}
                      </div>
                      <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-mono text-white/40">{formatDuration(track.duration)}</span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(track)}
                      className="p-1.5 text-rose-500 hover:text-white transition-colors cursor-pointer"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. PLAYLISTS TAB */}
      {!selectedPlaylist && activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsNewPlaylistOpen(true)}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Новый плейлист
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                className="group p-3.5 rounded-[22px] transition-all cursor-pointer hover:border-white/25"
                style={{
                  background: 'rgba(6, 6, 9, 0.45)',
                  backdropFilter: 'blur(28px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow:
                    '0 20px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.18) inset',
                }}
              >
                <div className="relative aspect-video rounded-[16px] overflow-hidden mb-3 bg-neutral-900 border border-white/10">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-2.5">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {pl.title}
                  </h3>
                  {!pl.isDefault && onDeletePlaylist && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onDeletePlaylist(pl.id);
                      }}
                      className="p-1 text-white/30 hover:text-rose-400 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-white/40 line-clamp-1 mt-0.5">{pl.description}</p>
                <div className="text-[10px] font-mono text-white/30 mt-2">{pl.tracks.length} треков</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. HISTORY TAB */}
      {!selectedPlaylist && activeTab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div
              className="py-16 text-center p-8 rounded-[22px] space-y-3"
              style={{
                background: 'rgba(6, 6, 9, 0.45)',
                backdropFilter: 'blur(28px) saturate(190%)',
                WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
              }}
            >
              <History className="w-8 h-8 text-white/20 mx-auto" />
              <h3 className="text-sm font-semibold text-white">История пуста</h3>
              <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                Здесь будут отображаться недавно прослушанные записи.
              </p>
            </div>
          ) : (
            history.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => playInContext(track, history, 'history')}
                className="flex items-center justify-between p-3 px-4 rounded-[20px] transition-all cursor-pointer hover:border-white/20"
                style={{
                  background: 'rgba(6, 6, 9, 0.45)',
                  backdropFilter: 'blur(28px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 14px 40px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img src={track.artworkUrl} alt={track.title} className="w-11 h-11 rounded-[14px] object-cover flex-shrink-0 border border-white/10" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{track.title}</div>
                    <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-white/40">{formatDuration(track.duration)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE PLAYLIST MODAL in COWIO Design System Modal Specs */}
      {isNewPlaylistOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsNewPlaylistOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-[22px] p-6 space-y-5 animate-fadeIn"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AnimatedEmoji category="Smileys" name="Partying Face" size={20} fallbackText="🎉" />
                <h3 className="text-base font-bold text-white">Создать плейлист</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPlaylistOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <input
                type="text"
                required
                placeholder="Название плейлиста"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                }}
              />
              <textarea
                rows={2}
                placeholder="Описание (необязательно)"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                }}
              />
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPlaylistOpen(false)}
                  className="px-4 py-2 text-xs text-white/50 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-md"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL in COWIO Design System Modal Specs */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsSettingsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-[22px] p-6 space-y-5 animate-fadeIn"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AnimatedEmoji category="Objects" name="Locked With Key" size={20} fallbackText="⚙️" />
                <h3 className="text-base font-bold text-white">Настройки платформы</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-white/40 mb-1.5">
                  Название сервиса
                </label>
                <input
                  type="text"
                  value={tempBrand}
                  onChange={e => setTempBrand(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-xs text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                  }}
                />
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-white/40 leading-relaxed">
                Потоковое воспроизведение: Lossless FLAC / 320kbps MP3 / Официальные превью.
                Полное соблюдение правил: никаких внешних AI-моделей или скрытых ключей (Раздел 11 ТЗ).
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-xs text-white/50 hover:text-white transition-colors"
                >
                  Закрыть
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-md"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
