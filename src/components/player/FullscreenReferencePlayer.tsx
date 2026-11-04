import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.js';
import { AmbientParticlesCanvas } from './AmbientParticlesCanvas.js';
import { AudioVisualizer } from './AudioVisualizer.js';
import { FloatingPillNotification } from './FloatingPillNotification.js';
import { SynchronizedLyricsDisplay } from './SynchronizedLyricsDisplay.js';
import { AnimatedEmoji } from '../common/AnimatedEmoji.js';
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
  Minimize2,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Loader2,
  Radio,
} from 'lucide-react';

export function FullscreenReferencePlayer() {
  const {
    currentTrack,
    isPlaying,
    playerStatus,
    statusMessage,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    lyrics,
    lyricsLoading,
    lyricsMessage,
    requestLyrics,
    cancelLyricsRequest,
    isFullscreenPlayerOpen,
    fullscreenInitialTab,
    audioAnalyser,
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
    closeFullscreenPlayer,
    queue,
    playTrack,
    retryPlayback,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'queue'>(fullscreenInitialTab);

  React.useEffect(() => {
    setActiveTab(fullscreenInitialTab);
  }, [fullscreenInitialTab]);

  // Lazy on-demand lyrics loading: only when lyrics tab is open
  React.useEffect(() => {
    if (isFullscreenPlayerOpen && activeTab === 'lyrics' && currentTrack) {
      requestLyrics(currentTrack);
    }
  }, [isFullscreenPlayerOpen, activeTab, currentTrack?.id]);

  if (!isFullscreenPlayerOpen || !currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const isPreview = currentTrack.playback.streamType === 'preview';

  // Time formatters
  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingTime = Math.max(0, duration - currentTime);
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Музыкальный плеер"
      className="fixed inset-0 z-50 flex flex-col text-[#f3f4f6] overflow-hidden select-none"
      style={{
        backgroundColor: '#060609',
        backgroundImage:
          'radial-gradient(circle at 50% 35%, #151720 0%, #0a0b10 55%, #050608 100%)',
      }}
    >
      {/* Background Amber/Orange Ambient Particles */}
      <AmbientParticlesCanvas isPlaying={isPlaying} />

      {/* Edge Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1] shadow-[inset_0_0_160px_rgba(0,0,0,0.95)]" />

      {/* TOP HEADER BAR */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-6 pb-2">
        {/* Top-Left: Audio Spectrum Visualizer */}
        <div className="flex-1 flex justify-start">
          <AudioVisualizer analyser={audioAnalyser} isPlaying={isPlaying} />
        </div>

        {/* Top-Center: Floating Capsule Notification Pill */}
        <div className="flex-shrink-0 flex justify-center">
          <FloatingPillNotification
            track={currentTrack}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
          />
        </div>

        {/* Top-Right: Controls & Minimize */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {/* Tab switch between Lyrics and Queue in COWIO glass */}
          <div
            className="flex items-center rounded-2xl p-1 text-xs"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 1px 0 0 rgba(255, 255, 255, 0.15) inset',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('lyrics')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-white/20 text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Текст
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-white/20 text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Очередь ({queue.length})
            </button>
          </div>

          {/* Minimize Player Button */}
          <button
            type="button"
            onClick={closeFullscreenPlayer}
            aria-label="Свернуть плеер"
            className="p-2.5 rounded-2xl text-white/70 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            }}
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* PREVIEW FINISHED BANNER */}
      {playerStatus === 'preview_ended' && (
        <div
          className="relative z-20 mx-auto mt-2 max-w-xl px-4 py-2.5 rounded-[20px] flex items-center justify-between gap-3 text-xs text-amber-200"
          style={{
            background: 'rgba(6, 6, 9, 0.6)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 1px 0 0 rgba(245, 158, 11, 0.2) inset',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>30-секундный фрагмент завершён. Полный трек доступен на официальных сервисах:</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => seek(0)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1 shadow"
            >
              <RotateCcw className="w-3 h-3" /> Повторить
            </button>
            {currentTrack.playback.externalUrl && (
              <a
                href={currentTrack.playback.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                Открыть <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {playerStatus === 'error' && (
        <div
          className="relative z-20 mx-auto mt-2 max-w-md px-4 py-2.5 rounded-[20px] flex items-center justify-between gap-3 text-xs text-rose-200"
          style={{
            background: 'rgba(6, 6, 9, 0.6)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 1px 0 0 rgba(244, 63, 94, 0.2) inset',
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{statusMessage || 'Ошибка подключения к источнику'}</span>
          </div>
          <button
            type="button"
            onClick={retryPlayback}
            className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow"
          >
            Повторить
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 px-6 md:px-16 py-4 items-center max-w-7xl mx-auto w-full overflow-hidden">
        {/* LEFT COLUMN: Album Art, Metadata, Timeline, Controls */}
        <section aria-label="Управление воспроизведением" className="lg:col-span-6 flex flex-col justify-center max-w-md mx-auto lg:max-w-none w-full">
          {/* Large Square Album Art */}
          <div
            className="relative aspect-square w-full max-w-[270px] md:max-w-[320px] lg:max-w-[340px] mx-auto lg:mx-0 rounded-[22px] overflow-hidden group"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08) inset',
            }}
          >
            <img
              src={currentTrack.artworkUrl}
              alt={`${currentTrack.title} cover`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Subtle inner shadow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {/* Badges on artwork in COWIO frosted glass */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {isPreview ? (
                <div
                  className="px-3 py-1 rounded-[14px] text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold"
                  style={{
                    background: 'rgba(6, 6, 9, 0.65)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  30с. Превью
                </div>
              ) : (
                <div
                  className="px-3 py-1 rounded-[14px] text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold"
                  style={{
                    background: 'rgba(6, 6, 9, 0.65)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                  }}
                >
                  Полный трек
                </div>
              )}
              {currentTrack.versionType !== 'original' && (
                <div
                  className="px-2.5 py-0.5 rounded-[12px] text-[9px] font-mono uppercase tracking-wider text-white/80 font-medium"
                  style={{
                    background: 'rgba(6, 6, 9, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                  }}
                >
                  {currentTrack.versionType.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>

          {/* Title & Artist */}
          <div className="mt-6 text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-1 font-sans">
              {currentTrack.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base text-[#9ca3af] font-normal truncate">
                {currentTrack.artist}
              </span>
              {currentTrack.album && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/40 truncate">{currentTrack.album}</span>
                </>
              )}
            </div>
          </div>

          {/* Sleek Timeline */}
          <div className="mt-5 w-full">
            <div
              className="relative w-full h-2 group cursor-pointer flex items-center"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                seek(pos * duration);
              }}
            >
              {/* Background Gray Line */}
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                {/* White Played Line */}
                <div
                  className="h-full bg-white rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Round White Scrubber */}
              <div
                className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9)] -translate-x-1/2 transition-all opacity-90 group-hover:scale-125"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Timers */}
            <div className="flex justify-between items-center text-xs font-mono text-[#9ca3af] mt-2">
              <span>{formatTime(currentTime)}</span>
              <span className="flex items-center gap-1.5">
                {isPreview && (
                  <span className="text-[10px] text-amber-400 font-sans uppercase">Фрагмент</span>
                )}
                <span>-{formatTime(remainingTime)}</span>
              </span>
            </div>
          </div>

          {/* Controls: Prev, Play/Pause, Next + Secondary Buttons */}
          <div className="mt-5 flex items-center justify-between w-full">
            {/* Shuffle */}
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label={isShuffle ? 'Выключить случайный порядок' : 'Включить случайный порядок'}
              className={`p-2 transition-colors cursor-pointer ${
                isShuffle ? 'text-amber-400' : 'text-white/40 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Core Transport */}
            <div className="flex items-center gap-6">
              {/* Previous Track */}
              <button
                type="button"
                onClick={prevTrack}
                aria-label="Предыдущий трек"
                className="p-2 text-white/80 hover:text-white transition-transform active:scale-90 cursor-pointer"
              >
                <SkipBack className="w-6 h-6 fill-white/10" />
              </button>

              {/* Center Play / Pause: White circular disc with dark icon as in reference */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
              >
                {playerStatus === 'loading' || playerStatus === 'buffering' ? (
                  <Loader2 className="w-7 h-7 animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-current stroke-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current stroke-current ml-1" />
                )}
              </button>

              {/* Next Track */}
              <button
                type="button"
                onClick={nextTrack}
                aria-label="Следующий трек"
                className="p-2 text-white/80 hover:text-white transition-transform active:scale-90 cursor-pointer"
              >
                <SkipForward className="w-6 h-6 fill-white/10" />
              </button>
            </div>

            {/* Repeat */}
            <button
              type="button"
              onClick={cycleRepeat}
              aria-label={`Режим повтора: ${repeatMode}`}
              className={`p-2 transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-amber-400' : 'text-white/40 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Bottom metadata toolbar: Favorite & External Platform Sources in COWIO style */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            {/* Favorite Heart Button */}
            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack)}
              aria-label={isFav ? 'Удалить из избранного' : 'Добавить в избранное'}
              className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isFav ? 'text-rose-500 fill-rose-500' : 'text-white/40 hover:text-rose-400'
                }`}
              />
              <span className="font-medium">{isFav ? 'В избранном' : 'В избранное'}</span>
            </button>

            {/* External Platform Source Badges with Direct Links */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/30 mr-1 hidden sm:inline">Платформы:</span>
              {currentTrack.sources.map(src => (
                <a
                  key={src.platform}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`Открыть в ${src.platform.toUpperCase()}`}
                  className="px-2.5 py-1 rounded-[10px] border border-white/14 text-[9px] font-mono uppercase tracking-wider text-white/70 hover:text-white transition-all flex items-center gap-1 hover:border-white/30"
                  style={{
                    background: 'rgba(6, 6, 9, 0.45)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {src.platform}
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Kinetic Synchronized Lyrics OR Queue in COWIO Frosted Glass */}
        <section
          aria-label="Текст песни и очередь"
          className="lg:col-span-6 h-[440px] md:h-[500px] flex flex-col relative rounded-[22px] overflow-hidden"
          style={{
            background: 'rgba(6, 6, 9, 0.45)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow:
              '0 24px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
          }}
        >
          {activeTab === 'lyrics' ? (
            lyricsLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 text-white/50 space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
                <p className="text-sm font-medium text-white/80">{lyricsMessage || 'Поиск текста песни...'}</p>
                <p className="text-xs text-white/40">Поиск в открытой базе синхронизированных текстов LRCLIB</p>
              </div>
            ) : lyrics && lyrics.length > 0 ? (
              <SynchronizedLyricsDisplay
                lyrics={lyrics}
                currentTime={currentTime}
                onSeek={seek}
                fontSize="large"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 text-white/40 space-y-3">
                <AnimatedEmoji category="Smileys" name="Partying Face" size={32} fallbackText="🎵" />
                <p className="text-sm font-semibold text-white/70">Текст песни</p>
                <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                  Текст для этой композиции пока отсутствует в базе синхронизированных текстов.
                </p>
              </div>
            )
          ) : (
            /* Queue View */
            <div className="h-full overflow-y-auto p-4 space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-white/40 px-2 py-1 flex items-center justify-between">
                <span>Очередь воспроизведения ({queue.length})</span>
                <span className="text-[10px] text-white/30">Свободное переключение</span>
              </div>
              {queue.map((track, i) => {
                const isCurrent = track.id === currentTrack.id;
                return (
                  <button
                    key={`${track.id}-${i}`}
                    type="button"
                    onClick={() => playTrack(track)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'border border-amber-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.2)_inset]'
                        : 'border border-transparent hover:border-white/10'
                    }`}
                    style={{
                      background: isCurrent ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <span className="w-5 text-center text-xs font-mono text-white/40">
                      {isCurrent ? '▶' : i + 1}
                    </span>
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate font-medium ${isCurrent ? 'text-amber-400 font-semibold' : 'text-white'}`}>
                        {track.title}
                      </div>
                      <div className="text-xs text-white/40 truncate">{track.artist}</div>
                    </div>
                    <div className="text-xs font-mono text-white/40 flex-shrink-0">
                      {formatTime(track.duration)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER BAR: Volume & Quality in COWIO style */}
      <footer
        className="relative z-10 px-8 py-3.5 flex items-center justify-between text-xs text-white/40 border-t border-white/10"
        style={{
          background: 'rgba(6, 6, 9, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="hover:text-white transition-colors cursor-pointer"
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
            className="w-24 md:w-32 h-1 bg-white/20 rounded-full accent-white cursor-pointer"
          />
        </div>

        <div className="font-mono text-[11px] tracking-widest uppercase text-white/40 flex items-center gap-2">
          <span>{currentTrack.playback.quality}</span>
          <span className="text-white/20">·</span>
          <span>{isPreview ? 'OFFICIAL PREVIEW' : 'FULL AUDIO STREAM'}</span>
        </div>
      </footer>
    </div>
  );
}
