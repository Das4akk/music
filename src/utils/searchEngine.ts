import { Track, VersionType } from '../types/music.js';

/**
 * Normalizes query string for music search:
 * - strips punctuation, extra whitespace
 * - extracts artists / separators like "-" or "–"
 */
export function normalizeQuery(query: string): {
  cleanQuery: string;
  artistPart?: string;
  titlePart?: string;
} {
  const trimmed = query.trim().toLowerCase();
  
  // Check for common artist - track patterns
  const match = trimmed.match(/^(.+?)\s*(?:[-–—:]|by)\s*(.+)$/i);
  if (match) {
    const p1 = match[1].trim();
    const p2 = match[2].trim();
    return {
      cleanQuery: trimmed,
      artistPart: p1,
      titlePart: p2,
    };
  }

  return {
    cleanQuery: trimmed,
  };
}

/**
 * Detects version type from track title or subtitle.
 * Important: does NOT merge original with slowed / sped up / remix without justification.
 */
export function detectVersion(title: string): VersionType {
  const lower = title.toLowerCase();

  if (lower.includes('slowed') || lower.includes('reverb') || lower.includes('slow')) {
    return 'slowed';
  }
  if (lower.includes('sped up') || lower.includes('speed up') || lower.includes('nightcore')) {
    return 'sped_up';
  }
  if (lower.includes('remix') || lower.includes('rmx') || lower.includes('flip')) {
    return 'remix';
  }
  if (lower.includes('instrumental') || lower.includes('karaoke')) {
    return 'instrumental';
  }
  if (lower.includes('acoustic') || lower.includes('unplugged')) {
    return 'acoustic';
  }
  if (lower.includes('live') || lower.includes('in concert') || lower.includes('session')) {
    return 'live';
  }
  if (lower.includes('extended') || lower.includes('club mix')) {
    return 'extended';
  }
  if (lower.includes('radio edit') || lower.includes('radio version')) {
    return 'radio_edit';
  }
  if (lower.includes('remaster') || lower.includes('remastered')) {
    return 'remastered';
  }
  if (lower.includes('demo') || lower.includes('unreleased')) {
    return 'demo';
  }

  return 'original';
}

/**
 * Cleans track title for comparison by removing parenthetical metadata like "(Official Audio)", "(Slowed + Reverb)", etc.
 */
export function cleanTitleForMatching(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/ft\.?|feat\.?|prod\.?/gi, '')
    .replace(/[^a-z0-9\s]/gi, '')
    .trim();
}

/**
 * Checks whether two tracks represent the exact same recording and should be deduplicated
 * into one multi-source entity.
 */
export function shouldDeduplicate(trackA: Track, trackB: Track): boolean {
  // If both have valid ISRCs and they match, they are guaranteed the exact same recording
  if (trackA.isrc && trackB.isrc && trackA.isrc === trackB.isrc) {
    return true;
  }

  // Version types must match (never merge slowed with original)
  if (trackA.versionType !== trackB.versionType) {
    return false;
  }

  const cleanTitleA = cleanTitleForMatching(trackA.title);
  const cleanTitleB = cleanTitleForMatching(trackB.title);
  const cleanArtistA = trackA.artist.toLowerCase().trim();
  const cleanArtistB = trackB.artist.toLowerCase().trim();

  // If title and artist match closely and duration is within 4 seconds
  const titlesMatch = cleanTitleA === cleanTitleB || cleanTitleA.includes(cleanTitleB) || cleanTitleB.includes(cleanTitleA);
  const artistsMatch = cleanArtistA === cleanArtistB || cleanArtistA.includes(cleanArtistB) || cleanArtistB.includes(cleanArtistA);

  if (titlesMatch && artistsMatch) {
    const durationDiff = Math.abs(trackA.duration - trackB.duration);
    if (durationDiff <= 4) {
      return true;
    }
  }

  return false;
}

/**
 * Merges track sources from trackB into trackA
 */
export function mergeTracks(target: Track, source: Track): Track {
  const mergedSources = [...target.sources];
  for (const s of source.sources) {
    if (!mergedSources.some(existing => existing.platform === s.platform && existing.id === s.id)) {
      mergedSources.push(s);
    }
  }

  // If target has preview or is not streamable, but source is full, prefer full stream
  let playback = target.playback;
  let duration = target.duration;
  if (!target.playback.isStreamable && source.playback.isStreamable) {
    playback = source.playback;
    duration = source.duration;
  } else if (target.playback.streamType === 'preview' && source.playback.streamType === 'full') {
    playback = source.playback;
    duration = source.duration;
  }

  return {
    ...target,
    duration,
    sources: mergedSources,
    playback,
    isrc: target.isrc || source.isrc,
    lyrics: target.lyrics || source.lyrics,
  };
}

/**
 * Scores track relevance against a query
 */
export function scoreTrackRelevance(track: Track, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 100;

  let score = 0;
  const title = track.title.toLowerCase();
  const artist = track.artist.toLowerCase();
  const album = (track.album || '').toLowerCase();

  // Exact match bonus
  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 60;
  else if (title.includes(q)) score += 40;

  if (artist === q) score += 90;
  else if (artist.startsWith(q)) score += 50;
  else if (artist.includes(q)) score += 30;

  if (album.includes(q)) score += 15;

  // Full streaming bonus over preview
  if (track.playback.streamType === 'full') score += 70;
  else if (track.playback.isStreamable) score += 15;

  // Multi-source credibility bonus
  score += Math.min(track.sources.length * 5, 20);

  // Synced lyrics bonus for best player experience
  if (track.lyrics?.isSynced) score += 10;

  return score;
}

/**
 * Deduplicates and ranks tracks list
 */
export function deduplicateAndRank(tracks: Track[], query: string): Track[] {
  const deduplicated: Track[] = [];

  for (const track of tracks) {
    const existingIndex = deduplicated.findIndex(item => shouldDeduplicate(item, track));
    if (existingIndex >= 0) {
      deduplicated[existingIndex] = mergeTracks(deduplicated[existingIndex], track);
    } else {
      deduplicated.push({ ...track });
    }
  }

  return deduplicated.sort((a, b) => {
    return scoreTrackRelevance(b, query) - scoreTrackRelevance(a, query);
  });
}
