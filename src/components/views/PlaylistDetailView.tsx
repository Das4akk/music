import React from 'react';
import { Playlist, Track } from '../../types/music.js';
import { usePlayer } from '../../context/PlayerContext.js';
import { Play, Shuffle, ArrowLeft, Trash2, Clock, Music } from 'lucide-react';

interface PlaylistDetailViewProps {
  playlist: Playlist;
  onBack: () => void;
  onDeletePlaylist?: (id: string) => void;
  onRemoveTrack?: (playlistId: string, trackId: string) => void;
}

export function PlaylistDetailView({
  playlist,
  onBack,
  onDeletePlaylist,
  onRemoveTrack,
}: PlaylistDetailViewProps) {
  const { currentTrack, isPlaying, playTrack, toggleFavorite, isFavorite } = usePlayer();

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleShuffle = () => {
    if (playlist.tracks.length > 0) {
      const shuffled = [...playlist.tracks].sort(() => 0.5 - Math.random());
      playTrack(shuffled[0], shuffled);
    }
  };

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к плейлистам
      </button>

      {/* Playlist Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#1c1e26] to-[#121418] border border-white/10 shadow-2xl">
        <div className="w-44 h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/15">
          <img
            src={playlist.coverUrl}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left min-w-0">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-2">
            Плейлист
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {playlist.title}
          </h1>
          <p className="text-xs md:text-sm text-white/60 mt-2 max-w-xl">
            {playlist.description}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-white/40 mt-4">
            <span>{playlist.tracks.length} композиций</span>
            <span>·</span>
            <span>{totalMinutes} мин. звучания</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">Lossless FLAC</span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              type="button"
              onClick={handlePlayAll}
              disabled={playlist.tracks.length === 0}
              className="px-6 py-3 rounded-full bg-white text-black font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Слушать всё
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              disabled={playlist.tracks.length === 0}
              className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs md:text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              Перемешать
            </button>

            {!playlist.isDefault && onDeletePlaylist && (
              <button
                type="button"
                onClick={() => onDeletePlaylist(playlist.id)}
                aria-label="Удалить плейлист"
                className="p-3 rounded-full bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer ml-auto"
                title="Удалить плейлист"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {playlist.tracks.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            В этом плейлисте пока нет треков. Найдите треки в Поиске и добавьте их!
          </div>
        ) : (
          playlist.tracks.map((track, i) => {
            const isCur = currentTrack?.id === track.id;
            return (
              <div
                key={`${track.id}-${i}`}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isCur
                    ? 'bg-white/10 border-amber-500/40 shadow-lg'
                    : 'bg-[#13151a]/90 hover:bg-[#1a1c22] border-white/5 hover:border-white/15'
                }`}
              >
                <div
                  className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                  onClick={() => playTrack(track, playlist.tracks)}
                >
                  <span className="w-6 text-center text-xs font-mono text-white/40">
                    {isCur && isPlaying ? (
                      <span className="text-amber-400 font-bold">▶</span>
                    ) : (
                      i + 1
                    )}
                  </span>

                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold truncate ${isCur ? 'text-amber-400' : 'text-white'}`}>
                        {track.title}
                      </span>
                      {track.versionType !== 'original' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-white/10 text-amber-300">
                          {track.versionType.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-white/40">
                    {formatDuration(track.duration)}
                  </span>
                  {onRemoveTrack && (
                    <button
                      type="button"
                      onClick={() => onRemoveTrack(playlist.id, track.id)}
                      className="p-1.5 text-white/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Удалить из плейлиста"
                    >
                      <Trash2 className="w-4 h-4" />
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
