import React from 'react';
import { usePlayer } from '../../context/PlayerContext.js';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Maximize2,
  Mic2,
  Loader2,
} from 'lucide-react';

export function BottomPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    playerStatus,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    isFavorite,
    openFullscreenPlayer,
    requestLyrics,
  } = usePlayer();

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const isPreview = currentTrack.playback.streamType === 'preview';

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <aside
      aria-label="Панель воспроизведения"
      className="fixed bottom-16 md:bottom-3 left-0 md:left-64 right-0 md:right-4 z-30 md:rounded-[22px] px-4 md:px-6 py-2.5 md:py-3 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 select-none transition-all"
      style={{
        background: 'rgba(6, 6, 9, 0.65)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow:
          '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
      }}
    >
      {/* Top micro progress bar for entire width on mobile */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 cursor-pointer group md:hidden"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          seek(pos * duration);
        }}
      >
        <div
          className={`h-full transition-colors ${isPreview ? 'bg-amber-400' : 'bg-white'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* LEFT: Mini Track Info */}
      <div className="flex items-center gap-3.5 w-full md:w-1/4 min-w-0">
        <button
          type="button"
          onClick={() => openFullscreenPlayer('lyrics')}
          aria-label="Развернуть полноэкранный плеер"
          className="relative group flex-shrink-0 cursor-pointer"
        >
          <img
            src={currentTrack.artworkUrl}
            alt={currentTrack.title}
            className="w-12 h-12 rounded-[14px] object-cover border border-white/14 shadow-md group-hover:brightness-110 transition-all"
          />
          <div className="absolute inset-0 bg-black/40 rounded-[14px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openFullscreenPlayer('lyrics')}
              className="text-sm font-bold text-white hover:underline truncate cursor-pointer text-left"
            >
              {currentTrack.title}
            </button>
            {isPreview ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                30с.
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                Full
              </span>
            )}
          </div>
          <div className="text-xs text-[#9ca3af] truncate">
            {currentTrack.artist}
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(currentTrack)}
          aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer flex-shrink-0"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isFav ? 'text-rose-500 fill-rose-500' : 'hover:text-rose-400'
            }`}
          />
        </button>
      </div>

      {/* CENTER: Controls & Timeline */}
      <div className="flex flex-col items-center w-full md:w-2/4 max-w-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Случайный порядок"
            className={`p-1.5 transition-colors cursor-pointer hidden sm:block ${
              isShuffle ? 'text-amber-400' : 'text-white/40 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={prevTrack}
            aria-label="Предыдущий трек"
            className="p-1 text-white/70 hover:text-white transition-transform active:scale-90 cursor-pointer"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            {playerStatus === 'loading' || playerStatus === 'buffering' ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current stroke-current" />
            ) : (
              <Play className="w-4 h-4 fill-current stroke-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={nextTrack}
            aria-label="Следующий трек"
            className="p-1 text-white/70 hover:text-white transition-transform active:scale-90 cursor-pointer"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            aria-label="Режим повтора"
            className={`p-1.5 transition-colors cursor-pointer hidden sm:block ${
              repeatMode !== 'off' ? 'text-amber-400' : 'text-white/40 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Timeline Slider with Timestamps */}
        <div className="hidden sm:flex items-center gap-2.5 w-full mt-1.5">
          <span className="text-[11px] font-mono text-white/40 w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="relative flex-1 h-1.5 bg-white/15 rounded-full cursor-pointer flex items-center group"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              seek(pos * duration);
            }}
          >
            <div
              className={`h-full rounded-full transition-all duration-75 ${isPreview ? 'bg-amber-400' : 'bg-white'}`}
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 -translate-x-1/2 transition-opacity"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-white/40 w-12 text-left">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT: Volume, Lyrics & Fullscreen Expand */}
      <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
        {/* Open lyrics in fullscreen player */}
        <button
          type="button"
          onClick={() => openFullscreenPlayer('lyrics')}
          aria-label="Открыть текст песни"
          className="p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Текст песни"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            aria-label="Громкость"
            className="w-20 h-1 bg-white/20 rounded-full accent-white cursor-pointer"
          />
        </div>

        {/* Fullscreen Player Mode Button */}
        <button
          type="button"
          onClick={() => openFullscreenPlayer('lyrics')}
          aria-label="Открыть кинематографичный плеер"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer ml-1"
          title="Кинематографичный плеер"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
