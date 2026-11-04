import React from 'react';
import { usePlayer } from '../../context/PlayerContext.js';
import { Play, Pause, Trash2, X, Music2 } from 'lucide-react';

export function QueueDrawer() {
  const {
    currentTrack,
    isPlaying,
    queue,
    playTrack,
    togglePlay,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Очередь воспроизведения
          </h1>
          <p className="text-xs md:text-sm text-white/50 mt-1">
            Список композиций, запланированных для непрерывного прослушивания ({queue.length}).
          </p>
        </div>

        {queue.length > 1 && (
          <button
            type="button"
            onClick={clearQueue}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 border border-white/10 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Очистить очередь
          </button>
        )}
      </div>

      {/* Currently Playing Card */}
      {currentTrack && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Сейчас играет
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/15 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-base font-bold text-white truncate">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-white/60 truncate mt-0.5">
                  {currentTrack.artist}
                </div>
                <div className="text-[10px] font-mono text-amber-300 mt-1">
                  {currentTrack.playback.quality}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current stroke-current" />
              ) : (
                <Play className="w-5 h-5 fill-current stroke-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Tracks */}
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-white/40 px-1 py-1">
          Далее в очереди
        </div>

        {queue.length <= 1 ? (
          <div className="py-14 text-center text-white/30 text-xs">
            В очереди больше нет треков. Добавьте новые композиции из Поиска или Плейлистов.
          </div>
        ) : (
          queue.map((track, i) => {
            const isCur = currentTrack?.id === track.id;
            return (
              <div
                key={`${track.id}-${i}`}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCur
                    ? 'bg-white/10 border-amber-500/40 shadow'
                    : 'bg-[#13151a]/90 hover:bg-[#1a1c22] border-white/5 hover:border-white/15'
                }`}
              >
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => playTrack(track)}
                >
                  <span className="w-5 text-center text-xs font-mono text-white/40">
                    {isCur ? '▶' : i + 1}
                  </span>
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${isCur ? 'text-amber-400' : 'text-white'}`}>
                      {track.title}
                    </div>
                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/40">
                    {formatDuration(track.duration)}
                  </span>
                  {!isCur && (
                    <button
                      type="button"
                      onClick={() => removeFromQueue(track.id)}
                      aria-label="Удалить из очереди"
                      className="p-1.5 text-white/30 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
