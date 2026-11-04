import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../../types/music.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { AnimatedEmoji } from '../common/AnimatedEmoji.js';
import {
  Search,
  Play,
  Pause,
  Heart,
  ExternalLink,
  Plus,
  Loader2,
  Check,
  Filter,
} from 'lucide-react';

interface SearchViewProps {
  initialQuery?: string;
}

export function SearchView({ initialQuery = '' }: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Track[]>([]);
  const [sourcesQueried, setSourcesQueried] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'full' | 'preview'>('all');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    currentTrack,
    isPlaying,
    playInContext,
    togglePlay,
    toggleFavorite,
    isFavorite,
    addToQueue,
  } = usePlayer();

  const performSearch = async (searchTerm: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('q', searchTerm.trim());

      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });

      if (res.ok) {
        const data = (await res.json()) as { tracks: Track[]; sourcesQueried: string[] };
        setResults(data.tracks || []);
        setSourcesQueried(data.sourcesQueried || []);
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        console.warn('Search query error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    } else {
      performSearch('');
    }
  }, [initialQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    performSearch(query);
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(track);
    setAddedQueueId(track.id);
    setTimeout(() => setAddedQueueId(null), 1500);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredResults = results.filter(track => {
    if (activeFilter === 'full') return track.playback.streamType === 'full';
    if (activeFilter === 'preview') return track.playback.streamType === 'preview';
    return true;
  });

  return (
    <div className="space-y-6 pb-24 animate-fadeIn max-w-4xl">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Поиск музыки</h1>
        <p className="text-xs text-white/40 mt-1">
          Многопоточный поиск по каталогам Audius (Full stream), Deezer, Apple Music и свободным архивам.
        </p>
      </div>

      {/* Clean Minimal Search Input in COWIO Frosted Glass */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="search"
          value={query}
          onChange={handleInputChange}
          placeholder="Поиск по исполнителю или композиции (например, PureSnow, DVRST, Resonance)..."
          aria-label="Поиск композиций"
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
          disabled={isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-white/90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Поиск'}
        </button>
      </form>

      {/* Filter tabs and results count */}
      {hasSearched && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-white/40 font-mono">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-white/30" />
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-black font-semibold shadow'
                  : 'text-white/60 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              Все ({results.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('full')}
              className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                activeFilter === 'full'
                  ? 'bg-emerald-400 text-black font-semibold shadow'
                  : 'text-emerald-400/70 hover:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              Полные треки ({results.filter(r => r.playback.streamType === 'full').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('preview')}
              className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                activeFilter === 'preview'
                  ? 'bg-amber-400 text-black font-semibold shadow'
                  : 'text-amber-400/70 hover:text-amber-400 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              Превью 30с. ({results.filter(r => r.playback.streamType === 'preview').length})
            </button>
          </div>

          <span className="hidden sm:inline">Источники: {sourcesQueried.join(', ')}</span>
        </div>
      )}

      {/* Results List in COWIO Frosted Glass rows */}
      {isLoading && results.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-white/40 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
          <span className="text-xs">Поиск музыки по источникам...</span>
        </div>
      ) : filteredResults.length === 0 ? (
        <div
          className="py-14 text-center p-8 rounded-[22px] space-y-4"
          style={{
            background: 'rgba(6, 6, 9, 0.45)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
          }}
        >
          <AnimatedEmoji category="Smileys" name="Partying Face" size={36} fallbackText="🎵" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              {query.trim() ? `Ничего не найдено по запросу «${query.trim()}»` : 'Начните поиск музыки'}
            </h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed mt-1">
              {query.trim()
                ? 'Попробуйте изменить формулировку или выбрать одну из популярных категорий ниже.'
                : 'Введите имя артиста, название трека или выберите популярный жанр с полными треками:'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-md mx-auto">
            {['Phonk', 'Synthwave', 'Lofi', 'Electronic', 'Rock', 'Chillhop', 'Hip Hop'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  performSearch(tag);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-all cursor-pointer border border-white/10 hover:border-white/30 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResults.map((track, idx) => {
            const isCur = currentTrack?.id === track.id;
            const isFav = isFavorite(track.id);
            const isPreview = track.playback.streamType === 'preview';
            const wasAdded = addedQueueId === track.id;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`group flex items-center justify-between p-3 px-4 rounded-[20px] transition-all ${
                  isCur
                    ? 'border border-amber-400/40 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_1px_0_0_rgba(255,255,255,0.25)_inset]'
                    : 'hover:border-white/20'
                }`}
                style={{
                  background: isCur ? 'rgba(6, 6, 9, 0.65)' : 'rgba(6, 6, 9, 0.45)',
                  backdropFilter: 'blur(28px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                  border: isCur ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow:
                    '0 14px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 1px 0 0 rgba(255, 255, 255, 0.12) inset',
                }}
              >
                {/* Left: Play button, Cover, Title & Artist */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={() => (isCur ? togglePlay() : playInContext(track, filteredResults, 'search'))}
                    className="relative w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10 cursor-pointer"
                  >
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
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

                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => (isCur ? togglePlay() : playInContext(track, filteredResults, 'search'))}
                        className={`text-sm font-semibold truncate cursor-pointer hover:underline ${
                          isCur ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </span>

                      {/* Stream type badge */}
                      {isPreview ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 flex-shrink-0">
                          30с. Превью
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                          Full
                        </span>
                      )}

                      {track.versionType !== 'original' && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-white/5 border border-white/10 text-white/60 flex-shrink-0">
                          {track.versionType.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-white/50 truncate mt-0.5">
                      <span className="text-white/80">{track.artist}</span>
                      {track.album && <span> · {track.album}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Source link, Duration, Queue, Like */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Primary Source Badge */}
                  {track.playback.externalUrl && (
                    <a
                      href={track.playback.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Открыть на официальной платформе"
                      className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase text-white/50 hover:text-white px-2.5 py-1 rounded-[10px] border border-white/10 hover:border-white/20 transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      {track.playback.source}
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  <span className="text-xs font-mono text-white/40 w-11 text-right">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Add to queue */}
                  <button
                    type="button"
                    onClick={() => handleAddToQueue(track)}
                    aria-label="В очередь"
                    className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                    title="В очередь"
                  >
                    {wasAdded ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                  </button>

                  {/* Favorite */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(track)}
                    aria-label="В избранное"
                    className="p-1.5 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
