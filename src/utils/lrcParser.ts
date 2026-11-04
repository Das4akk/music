import { LyricLine, Track } from '../types/music.js';

/**
 * Parses standard .lrc format:
 * [00:12.34]Lyric text line here
 * [01:05.10]Another line
 */
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Collect all timestamps in this line
    let match: RegExpExecArray | null;
    const timestamps: number[] = [];
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3]
        ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10)
        : 0;
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
      timestamps.push(totalSeconds);
    }

    // Strip timestamps to get clean lyric text
    const text = trimmed.replace(timeRegex, '').trim();

    if (text && timestamps.length > 0) {
      for (const t of timestamps) {
        result.push({ time: t, text });
      }
    }
  }

  // Sort by timestamp
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Finds index of active lyric line for current playback time
 */
export function findActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (currentTime < lyrics[0].time) return 0;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }

  return 0;
}

/**
 * Generates rhythmic synced lyric lines if track only has plain text or needs fallback synced preview
 */
export function generateSyncedLyricsFromPlain(plainText: string, duration: number): LyricLine[] {
  const lines = plainText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('[') && !l.endsWith(']'));

  if (lines.length === 0) return [];

  const step = Math.max(2.5, (duration - 4) / Math.max(1, lines.length));
  return lines.map((text, idx) => ({
    time: Math.min(duration - 1, 2 + idx * step),
    text,
  }));
}

/**
 * Default fallback lyrics generator for tracks without embedded lyrics
 */
export function createAmbientLyricLines(track: Track): LyricLine[] {
  const dur = track.duration || 180;
  return [
    { time: 2, text: `♪ ${track.title} ♪` },
    { time: Math.floor(dur * 0.15), text: `Performed by ${track.artist}` },
    { time: Math.floor(dur * 0.30), text: track.album ? `From album: ${track.album}` : `High fidelity audio stream` },
    { time: Math.floor(dur * 0.45), text: `♪ Instrumental harmony ♪` },
    { time: Math.floor(dur * 0.65), text: `♪ ${track.artist} - ${track.title} ♪` },
    { time: Math.floor(dur * 0.85), text: `♪ Outro resonance ♪` },
  ];
}
