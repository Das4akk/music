import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Track, LyricLine, PlayerStatus } from '../types/music.js';

export type PlaybackContextType = 'search' | 'favorites' | 'history' | 'playlist' | 'custom';

export interface PlaybackManager {
  // State variables
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  playbackSource: string;
  playbackContext: PlaybackContextType;
  isPlaying: boolean;
  repeatMode: 'off' | 'all' | 'one';
  shuffleEnabled: boolean;
  isShuffle: boolean; // alias for shuffleEnabled
  playerStatus: PlayerStatus;
  statusMessage: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  lyricsMessage: string | null;
  favorites: Track[];
  history: Track[];
  isFullscreenPlayerOpen: boolean;
  fullscreenInitialTab: 'lyrics' | 'queue';
  audioAnalyser: AnalyserNode | null;
  isAudioConnected: boolean;

  // Actions
  playInContext: (track: Track, newQueue: Track[], context: PlaybackContextType) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playAtIndex: (index: number) => void;
  togglePlay: () => void;
  seek: (timeInSeconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavorite: (track: Track) => Promise<boolean>;
  isFavorite: (trackId: string) => boolean;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  openFullscreenPlayer: (tab?: 'lyrics' | 'queue') => void;
  closeFullscreenPlayer: () => void;
  requestLyrics: (track?: Track) => Promise<void>;
  cancelLyricsRequest: () => void;
  retryPlayback: () => void;
}

export function resolvePlaybackUrl(streamUrl?: string): string {
  if (!streamUrl) return '';
  if (streamUrl.startsWith('/audio/') || streamUrl.startsWith('/api/')) {
    return streamUrl;
  }
  if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
    return `/api/stream?url=${encodeURIComponent(streamUrl)}`;
  }
  return streamUrl;
}

const PlayerContext = createContext<PlaybackManager | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Central Playback Manager state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playbackSource, setPlaybackSource] = useState<string>('');
  const [playbackContext, setPlaybackContext] = useState<PlaybackContextType>('search');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [repeatMode, setRepeatModeState] = useState<'off' | 'all' | 'one'>('all');
  const [shuffleEnabled, setShuffleEnabled] = useState<boolean>(false);

  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState<boolean>(false);
  const [lyricsMessage, setLyricsMessage] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState<boolean>(false);
  const [fullscreenInitialTab, setFullscreenInitialTab] = useState<'lyrics' | 'queue'>('lyrics');
  const [isAudioConnected, setIsAudioConnected] = useState<boolean>(false);

  // Synchronous refs to prevent race conditions during rapid playback control
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const isSourceConnectedRef = useRef<boolean>(false);

  const queueRef = useRef<Track[]>([]);
  const originalQueueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const currentTrackRef = useRef<Track | null>(null);
  const playbackContextRef = useRef<PlaybackContextType>('search');
  const repeatModeRef = useRef<'off' | 'all' | 'one'>('all');
  const shuffleEnabledRef = useRef<boolean>(false);

  const loadCounterRef = useRef<number>(0);
  const isSwitchingRef = useRef<boolean>(false);
  const lyricsCacheRef = useRef<Map<string, { lines: LyricLine[]; isSynced: boolean }>>(new Map());
  const lyricsAbortRef = useRef<AbortController | null>(null);

  // Setup single HTMLAudioElement instance with error handling
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isSwitchingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setPlayerStatus('playing');
      setStatusMessage(null);
    };

    const onPause = () => {
      if (!isSwitchingRef.current && audio.currentTime < (audio.duration || 1)) {
        setIsPlaying(false);
        setPlayerStatus('paused');
      }
    };

    const onWaiting = () => {
      if (audio.currentTime > 0) {
        setPlayerStatus('buffering');
        setStatusMessage('Буферизация потока...');
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      const cur = currentTrackRef.current;
      if (cur?.playback.streamType === 'preview') {
        setPlayerStatus('preview_ended');
        setStatusMessage('Официальный фрагмент 30 сек. завершён');
      } else {
        handleTrackEnd();
      }
    };

    const onError = () => {
      const err = audio.error;
      if (!audio.src) return;

      let reason = 'Ошибка аудио';
      if (err?.code === 1) reason = 'Воспроизведение прервано (MEDIA_ERR_ABORTED)';
      if (err?.code === 2) reason = 'Сетевая ошибка загрузки аудио (MEDIA_ERR_NETWORK)';
      if (err?.code === 3) reason = 'Ошибка декодирования аудио (MEDIA_ERR_DECODE)';
      if (err?.code === 4) reason = 'Формат аудио не поддерживается (MEDIA_ERR_SRC_NOT_SUPPORTED)';

      setIsPlaying(false);
      setPlayerStatus('error');
      setStatusMessage(reason);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Initial load favorites & history from backend store
    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFavorites(data);
      })
      .catch(() => {});

    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {});

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, []);

  // Web Audio Context setup safely
  const initWebAudio = () => {
    if (!audioRef.current || isSourceConnectedRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioContextRef.current || new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      isSourceConnectedRef.current = true;
      setIsAudioConnected(true);
    } catch {
      setIsAudioConnected(false);
    }
  };

  // Sync with Media Session API for lockscreen and keyboard controls
  const updateMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'Aetheria Music',
        artwork: [
          { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', details => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, []);

  // On-demand lazy lyrics fetcher (called ONLY when user explicitly opens lyrics)
  const requestLyrics = async (targetTrack?: Track) => {
    const track = targetTrack || currentTrackRef.current;
    if (!track) return;

    // Check memory cache first
    const cached = lyricsCacheRef.current.get(track.id);
    if (cached) {
      setLyrics(cached.lines);
      setLyricsMessage(cached.lines.length === 0 ? 'Текст для этой композиции пока отсутствует в базе' : null);
      setLyricsLoading(false);
      return;
    }

    if (lyricsAbortRef.current) {
      lyricsAbortRef.current.abort();
    }
    const controller = new AbortController();
    lyricsAbortRef.current = controller;

    setLyricsLoading(true);
    setLyricsMessage('Ищем текст песни...');

    try {
      const params = new URLSearchParams({
        title: track.title,
        artist: track.artist,
        duration: String(track.duration || 180),
      });

      const res = await fetch(`/api/lyrics?${params.toString()}`, {
        signal: controller.signal,
      });

      if (res.ok) {
        const data = (await res.json()) as { lines?: LyricLine[]; isSynced?: boolean; notFound?: boolean };
        const lines = data.lines || [];
        lyricsCacheRef.current.set(track.id, { lines, isSynced: !!data.isSynced });
        setLyrics(lines);
        setLyricsMessage(lines.length === 0 ? 'Текст для этой композиции пока отсутствует в базе' : null);
      } else {
        lyricsCacheRef.current.set(track.id, { lines: [], isSynced: false });
        setLyrics([]);
        setLyricsMessage('Текст для этой композиции пока отсутствует в базе');
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name !== 'AbortError') {
        lyricsCacheRef.current.set(track.id, { lines: [], isSynced: false });
        setLyrics([]);
        setLyricsMessage('Текст для этой композиции пока отсутствует в базе');
      }
    } finally {
      setLyricsLoading(false);
    }
  };

  const cancelLyricsRequest = () => {
    if (lyricsAbortRef.current) {
      lyricsAbortRef.current.abort();
      lyricsAbortRef.current = null;
    }
    setLyricsLoading(false);
  };

  // Internal low-level play executor
  const playInternal = async (
    track: Track,
    index: number,
    activeQueue: Track[],
    context: PlaybackContextType
  ) => {
    isSwitchingRef.current = true;
    const currentLoadId = ++loadCounterRef.current;
    initWebAudio();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
    } catch {}

    // Atomic update of state & refs
    currentTrackRef.current = track;
    currentIndexRef.current = index;
    queueRef.current = activeQueue;
    playbackContextRef.current = context;

    setCurrentTrack(track);
    setCurrentIndex(index);
    setQueue(activeQueue);
    setPlaybackContext(context);
    setPlaybackSource(track.playback.source);

    setCurrentTime(0);
    const initialDuration = track.playback.streamType === 'preview'
      ? (track.playback.previewDuration || 30)
      : (track.duration || 180);
    setDuration(initialDuration);

    setPlayerStatus('loading');
    setStatusMessage('Подключение к источнику...');

    // Reset lyrics for new track - DO NOT LOAD AUTOMATICALLY (Lazy loading on-demand only)
    cancelLyricsRequest();
    setLyrics([]);
    setLyricsMessage(null);

    updateMediaSession(track);

    const stream = track.playback.streamUrl;
    if (!stream || !track.playback.isStreamable) {
      setIsPlaying(false);
      setPlayerStatus('error');
      setStatusMessage('Воспроизведение недоступно в приложении. Откройте в источнике.');
      isSwitchingRef.current = false;
      return;
    }

    const resolvedUrl = resolvePlaybackUrl(stream);

    audio.src = resolvedUrl;
    audio.currentTime = 0;
    audio.load();

    try {
      await audio.play();
      if (loadCounterRef.current === currentLoadId) {
        setIsPlaying(true);
        setPlayerStatus('playing');
        setStatusMessage(null);
      }
    } catch (err: unknown) {
      if (loadCounterRef.current !== currentLoadId) {
        return;
      }
      const error = err as { name?: string; message?: string };
      if (error?.name === 'AbortError') return;
      if (error?.name === 'NotAllowedError') {
        setIsPlaying(false);
        setPlayerStatus('paused');
        setStatusMessage('Нажмите Play для воспроизведения');
        return;
      }
      setIsPlaying(false);
      setPlayerStatus('error');
      setStatusMessage(error?.message || 'Ошибка воспроизведения аудиопотока');
    } finally {
      if (loadCounterRef.current === currentLoadId) {
        isSwitchingRef.current = false;
      }
    }

    // Record listening history to persistent backend
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track }),
    }).catch(() => {});

    setHistory(prev => [track, ...prev.filter(t => t.id !== track.id).slice(0, 49)]);
  };

  // Play a song within a specific context and queue (search, favorites, history, playlist)
  const playInContext = (
    track: Track,
    newQueue: Track[],
    context: PlaybackContextType
  ) => {
    let targetIndex = newQueue.findIndex(t => t.id === track.id);
    let activeList = [...newQueue];

    if (targetIndex < 0) {
      activeList = [track, ...activeList];
      targetIndex = 0;
    }

    originalQueueRef.current = [...activeList];

    if (shuffleEnabledRef.current) {
      // Keep target track at index 0, shuffle the rest
      const rest = activeList.filter(t => t.id !== track.id);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      activeList = [track, ...rest];
      targetIndex = 0;
    }

    playInternal(track, targetIndex, activeList, context);
  };

  // Play a track, optionally providing a new queue
  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (newQueue && newQueue.length > 0) {
      playInContext(track, newQueue, 'custom');
    } else {
      const curQueue = queueRef.current;
      const foundIdx = curQueue.findIndex(t => t.id === track.id);
      if (foundIdx >= 0) {
        playInternal(track, foundIdx, curQueue, playbackContextRef.current);
      } else {
        const updated = [track, ...curQueue];
        playInContext(track, updated, playbackContextRef.current);
      }
    }
  };

  // Play track by its index in the active queue
  const playAtIndex = (index: number) => {
    const curQueue = queueRef.current;
    if (index >= 0 && index < curQueue.length) {
      playInternal(curQueue[index], index, curQueue, playbackContextRef.current);
    }
  };

  const retryPlayback = () => {
    const cur = currentTrackRef.current;
    const curIdx = currentIndexRef.current;
    const curQueue = queueRef.current;
    if (cur) {
      playInternal(cur, curIdx >= 0 ? curIdx : 0, curQueue, playbackContextRef.current);
    }
  };

  const togglePlay = () => {
    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    const audio = audioRef.current;
    const cur = currentTrackRef.current;
    if (!audio || !cur) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setPlayerStatus('paused');
    } else {
      if (!audio.src && cur.playback.streamUrl) {
        audio.src = resolvePlaybackUrl(cur.playback.streamUrl);
        audio.load();
      }
      setPlayerStatus('loading');
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setPlayerStatus('playing');
          setStatusMessage(null);
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          setIsPlaying(false);
          setPlayerStatus('error');
          setStatusMessage('Не удалось возобновить воспроизведение');
        });
    }
  };

  const seek = (timeInSeconds: number) => {
    const audio = audioRef.current;
    if (audio && !isNaN(timeInSeconds)) {
      const clamped = Math.max(0, Math.min(timeInSeconds, duration));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
      if (playerStatus === 'preview_ended') {
        setPlayerStatus('playing');
        audio.play().catch(() => {});
      }
    }
  };

  const handleTrackEnd = () => {
    if (repeatModeRef.current === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    nextTrack();
  };

  // Next track in active queue
  const nextTrack = () => {
    const curQueue = queueRef.current;
    const curIdx = currentIndexRef.current;
    const curRepeat = repeatModeRef.current;

    if (!curQueue.length || curIdx < 0) return;

    if (curRepeat === 'one') {
      seek(0);
      if (audioRef.current) audioRef.current.play().catch(() => {});
      return;
    }

    if (curIdx + 1 < curQueue.length) {
      const nextIdx = curIdx + 1;
      playInternal(curQueue[nextIdx], nextIdx, curQueue, playbackContextRef.current);
    } else if (curRepeat === 'all') {
      playInternal(curQueue[0], 0, curQueue, playbackContextRef.current);
    } else {
      // Repeat off and reached end of queue: cleanly pause, do not revert to home or external songs
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setPlayerStatus('idle');
    }
  };

  // Previous track in active queue
  const prevTrack = () => {
    const curQueue = queueRef.current;
    const curIdx = currentIndexRef.current;
    const curRepeat = repeatModeRef.current;

    if (!curQueue.length || curIdx < 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (curIdx > 0) {
      const prevIdx = curIdx - 1;
      playInternal(curQueue[prevIdx], prevIdx, curQueue, playbackContextRef.current);
    } else if (curRepeat === 'all') {
      const lastIdx = curQueue.length - 1;
      playInternal(curQueue[lastIdx], lastIdx, curQueue, playbackContextRef.current);
    } else {
      seek(0);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  // Shuffle toggling preserves current track at active position
  const toggleShuffle = () => {
    const willBeShuffle = !shuffleEnabledRef.current;
    shuffleEnabledRef.current = willBeShuffle;
    setShuffleEnabled(willBeShuffle);

    const curTrack = currentTrackRef.current;
    const curQueue = queueRef.current;

    if (willBeShuffle) {
      originalQueueRef.current = [...curQueue];
      if (curTrack && curQueue.length > 1) {
        const rest = curQueue.filter(t => t.id !== curTrack.id);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        const shuffledQueue = [curTrack, ...rest];
        queueRef.current = shuffledQueue;
        currentIndexRef.current = 0;
        setQueue(shuffledQueue);
        setCurrentIndex(0);
      }
    } else {
      if (originalQueueRef.current.length > 0) {
        const restored = [...originalQueueRef.current];
        queueRef.current = restored;
        setQueue(restored);
        const restoredIdx = curTrack ? restored.findIndex(t => t.id === curTrack.id) : 0;
        const validIdx = restoredIdx >= 0 ? restoredIdx : 0;
        currentIndexRef.current = validIdx;
        setCurrentIndex(validIdx);
      }
    }
  };

  const cycleRepeat = () => {
    setRepeatModeState(prev => {
      const next: 'off' | 'all' | 'one' = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      repeatModeRef.current = next;
      return next;
    });
  };

  const isFavorite = (trackId: string): boolean => {
    return favorites.some(t => t.id === trackId);
  };

  const toggleFavorite = async (track: Track): Promise<boolean> => {
    const currentlyFav = isFavorite(track.id);
    const newFavorites = currentlyFav
      ? favorites.filter(t => t.id !== track.id)
      : [track, ...favorites];

    setFavorites(newFavorites);

    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      });
      const data = (await res.json()) as { isFavorite: boolean };
      return data.isFavorite;
    } catch {
      return !currentlyFav;
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      const updated = [...prev, track];
      queueRef.current = updated;
      return updated;
    });
  };

  const removeFromQueue = (trackId: string) => {
    setQueue(prev => {
      const updated = prev.filter(t => t.id !== trackId);
      queueRef.current = updated;
      return updated;
    });
  };

  const clearQueue = () => {
    const cur = currentTrackRef.current;
    if (cur) {
      setQueue([cur]);
      queueRef.current = [cur];
      setCurrentIndex(0);
      currentIndexRef.current = 0;
    } else {
      setQueue([]);
      queueRef.current = [];
      setCurrentIndex(-1);
      currentIndexRef.current = -1;
    }
  };

  const openFullscreenPlayer = (tab: 'lyrics' | 'queue' = 'lyrics') => {
    setFullscreenInitialTab(tab);
    setIsFullscreenPlayerOpen(true);
    if (tab === 'lyrics' && currentTrackRef.current) {
      requestLyrics(currentTrackRef.current);
    }
  };

  const closeFullscreenPlayer = () => {
    cancelLyricsRequest();
    setIsFullscreenPlayerOpen(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        playbackSource,
        playbackContext,
        isPlaying,
        repeatMode,
        shuffleEnabled,
        isShuffle: shuffleEnabled,
        playerStatus,
        statusMessage,
        currentTime,
        duration,
        volume,
        isMuted,
        lyrics,
        lyricsLoading,
        lyricsMessage,
        favorites,
        history,
        isFullscreenPlayerOpen,
        fullscreenInitialTab,
        audioAnalyser: analyserRef.current,
        isAudioConnected,
        playInContext,
        playTrack,
        playAtIndex,
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
        addToQueue,
        removeFromQueue,
        clearQueue,
        openFullscreenPlayer,
        closeFullscreenPlayer,
        requestLyrics,
        cancelLyricsRequest,
        retryPlayback,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
