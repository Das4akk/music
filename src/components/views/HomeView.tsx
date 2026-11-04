import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.js';
import { Play, Pause, Search, Heart, Clock, History, Sparkles, Music } from 'lucide-react';
import { AnimatedEmoji } from '../common/AnimatedEmoji.js';

interface HomeViewProps {
  playlists: { id: string; title: string; description: string; coverUrl: string; tracks: unknown[] }[];
  onSelectPlaylist: (id: string) => void;
  onNavigateToSearch: (query?: string) => void;
}

export function HomeView({
  onSelectPlaylist,
  onNavigateToSearch,
}: HomeViewProps) {
  const [quickQuery, setQuickQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const {
    currentTrack,
    isPlaying,
    playInContext,
    playTrack,
    togglePlay,
    toggleFavorite,
    isFavorite,
    favorites,
    history,
  } = usePlayer();

  useEffect(() => {
    fetch('/api/searches/recent')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRecentSearches(data);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onNavigateToSearch(quickQuery.trim());
    } else {
      onNavigateToSearch('');
    }
  };

  const handleStartWave = () => {
    if (favorites.length > 0) {
      playInContext(favorites[0], favorites, 'favorites');
    } else if (history.length > 0) {
      playInContext(history[0], history, 'history');
    } else {
      onNavigateToSearch('');
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasUserData = favorites.length > 0 || history.length > 0 || recentSearches.length > 0;

  return (
    <div className="space-y-8 pb-12 animate-fadeIn max-w-5xl">
      {/* 1. MINIMAL SEARCH BAR in COWIO Frosted Glass */}
      <section>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="search"
            value={quickQuery}
            onChange={e => setQuickQuery(e.target.value)}
            placeholder="Поиск по миллионам треков, артистов и альбомов..."
            aria-label="Быстрый поиск музыки"
            className="w-full py-4 pl-13 pr-28 text-white placeholder-white/30 text-sm outline-none transition-all rounded-[22px]"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                '0 18px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
            }}
          />
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            Найти
          </button>
        </form>
      </section>

      {/* 2. RECENT SEARCHES (Displayed only when user has actually searched) */}
      {recentSearches.length > 0 && (
        <section className="animate-fadeIn">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
              <History className="w-3.5 h-3.5" />
              <span>Недавние запросы</span>
            </div>
            <button
              type="button"
              onClick={() => {
                fetch('/api/searches/recent', { method: 'DELETE' }).catch(() => {});
                setRecentSearches([]);
              }}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              Очистить
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 8).map(q => (
              <button
                key={q}
                type="button"
                onClick={() => onNavigateToSearch(q)}
                className="px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-all cursor-pointer border border-white/10 hover:border-white/25 flex items-center gap-1.5"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Search className="w-3 h-3 text-white/40" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 3. CLEAN MINIMAL EMPTY STATE (If user hasn't favorited or listened to anything yet) */}
      {!hasUserData ? (
        <section
          className="relative overflow-hidden rounded-[24px] p-8 md:p-12 text-center transition-all"
          style={{
            background: 'rgba(6, 6, 9, 0.45)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow:
              '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
          }}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
              <Music className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Здесь будет ваша музыка
              </h2>
              <p className="text-xs md:text-sm text-white/50 mt-2 leading-relaxed">
                Воспользуйтесь поиском, чтобы найти любимые композиции и исполнителей. Ваши
                избранные треки, недавние запросы и история прослушиваний будут бережно сохранены
                на этой странице.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToSearch('')}
                className="px-6 py-3 rounded-full bg-white text-black font-bold text-xs md:text-sm inline-flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Найти первую песню
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* "МОЯ ВОЛНА" - Dynamically based on user's real library */}
          <section
            className="relative overflow-hidden rounded-[22px] p-6 md:p-8 transition-all"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow:
                '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
            }}
          >
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-amber-300 text-[11px] font-mono font-medium mb-2.5"
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <AnimatedEmoji category="Activity" name="Sparkles" size={16} fallbackText="✨" />
                  <span>Персональный поток</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Моя волна
                </h1>
                <p className="text-xs md:text-sm text-white/50 mt-1 max-w-md leading-relaxed">
                  Непрерывный поток треков на основе вашей персональной библиотеки и истории.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartWave}
                className="px-6 py-3.5 rounded-full bg-white text-black font-bold text-xs md:text-sm flex items-center gap-2.5 shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                Включить поток
              </button>
            </div>
          </section>

          {/* ИЗБРАННЫЕ КОМПОЗИЦИИ (User Favorites) */}
          {favorites.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Избранные композиции
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPlaylist('library_favorites')}
                  className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  Все ({favorites.length}) →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.slice(0, 6).map(track => {
                  const isCur = currentTrack?.id === track.id;
                  const isFav = isFavorite(track.id);
                  const isPreview = track.playback.streamType === 'preview';

                  return (
                    <div
                      key={track.id}
                      onClick={() => (isCur ? togglePlay() : playInContext(track, favorites, 'favorites'))}
                      className={`group flex items-center justify-between p-3 rounded-[20px] transition-all cursor-pointer ${
                        isCur
                          ? 'border border-amber-400/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_1px_0_0_rgba(255,255,255,0.25)_inset]'
                          : 'hover:border-white/20'
                      }`}
                      style={{
                        background: isCur ? 'rgba(6, 6, 9, 0.65)' : 'rgba(6, 6, 9, 0.45)',
                        backdropFilter: 'blur(28px) saturate(190%)',
                        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                        border: isCur
                          ? '1px solid rgba(245, 158, 11, 0.45)'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow:
                          '0 14px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCur && isPlaying ? (
                              <Pause className="w-4 h-4 text-amber-400 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div
                            className={`text-sm font-semibold truncate ${
                              isCur ? 'text-amber-400' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </div>
                          <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isPreview ? (
                          <span className="text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/25">
                            30с.
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                            Full
                          </span>
                        )}
                        <span className="text-xs font-mono text-white/40 hidden sm:inline">
                          {formatDuration(track.duration)}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(track);
                          }}
                          className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* НЕДАВНО ПРОСЛУШАННОЕ (Listening History) */}
          {history.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3.5">
                <Clock className="w-4 h-4 text-white/40" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Недавно прослушанное
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {history.slice(0, 6).map(track => {
                  const isCur = currentTrack?.id === track.id;
                  const isFav = isFavorite(track.id);
                  const isPreview = track.playback.streamType === 'preview';

                  return (
                    <div
                      key={track.id}
                      onClick={() => (isCur ? togglePlay() : playInContext(track, history, 'history'))}
                      className={`group flex items-center justify-between p-3 rounded-[20px] transition-all cursor-pointer ${
                        isCur
                          ? 'border border-amber-400/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_1px_0_0_rgba(255,255,255,0.25)_inset]'
                          : 'hover:border-white/20'
                      }`}
                      style={{
                        background: isCur ? 'rgba(6, 6, 9, 0.65)' : 'rgba(6, 6, 9, 0.45)',
                        backdropFilter: 'blur(28px) saturate(190%)',
                        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                        border: isCur
                          ? '1px solid rgba(245, 158, 11, 0.45)'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow:
                          '0 14px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCur && isPlaying ? (
                              <Pause className="w-4 h-4 text-amber-400 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div
                            className={`text-sm font-semibold truncate ${
                              isCur ? 'text-amber-400' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </div>
                          <div className="text-xs text-white/50 truncate mt-0.5">{track.artist}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isPreview ? (
                          <span className="text-[10px] font-mono text-amber-300 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/25">
                            30с.
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                            Full
                          </span>
                        )}
                        <span className="text-xs font-mono text-white/40 hidden sm:inline">
                          {formatDuration(track.duration)}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(track);
                          }}
                          className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
