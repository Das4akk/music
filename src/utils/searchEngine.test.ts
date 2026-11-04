import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeQuery,
  detectVersion,
  shouldDeduplicate,
  deduplicateAndRank,
} from './searchEngine.js';
import { Track } from '../types/music.js';

test('normalizeQuery splits artist and title', () => {
  const result = normalizeQuery('PureSnow - Teeth');
  assert.equal(result.artistPart, 'puresnow');
  assert.equal(result.titlePart, 'teeth');
});

test('detectVersion classifies slowed, sped up, remix correctly', () => {
  assert.equal(detectVersion('Teeth (Slowed + Reverb)'), 'slowed');
  assert.equal(detectVersion('Metamorphosis [Sped Up]'), 'sped_up');
  assert.equal(detectVersion('Midnight City (Kavinsky Remix)'), 'remix');
  assert.equal(detectVersion('Regular Track'), 'original');
});

test('shouldDeduplicate matches tracks with identical ISRC', () => {
  const trackA: Track = {
    id: '1',
    title: 'Teeth',
    artist: 'PureSnow',
    featuredArtists: [],
    album: 'Teeth - Single',
    artworkUrl: '',
    duration: 145,
    versionType: 'original',
    isrc: 'USUM71703861',
    playback: { isStreamable: true, streamType: 'full', streamUrl: '/audio/viper.mp3', source: 'deezer', quality: '320kbps', externalUrl: '' },
    sources: [{ platform: 'deezer', id: '1', url: '', available: true }],
  };
  const trackB: Track = {
    id: '2',
    title: 'Teeth',
    artist: 'PureSnow',
    featuredArtists: [],
    album: 'Teeth',
    artworkUrl: '',
    duration: 145,
    versionType: 'original',
    isrc: 'USUM71703861',
    playback: { isStreamable: false, streamType: 'external', streamUrl: '', source: 'apple', quality: '256kbps', externalUrl: '' },
    sources: [{ platform: 'apple', id: '2', url: '', available: true }],
  };

  assert.equal(shouldDeduplicate(trackA, trackB), true);
});

test('shouldDeduplicate does NOT merge original and slowed versions', () => {
  const trackA: Track = {
    id: '1',
    title: 'Teeth',
    artist: 'PureSnow',
    featuredArtists: [],
    album: 'Teeth',
    artworkUrl: '',
    duration: 145,
    versionType: 'original',
    playback: { isStreamable: true, streamType: 'full', streamUrl: '/audio/viper.mp3', source: 'deezer', quality: '320kbps', externalUrl: '' },
    sources: [{ platform: 'deezer', id: '1', url: '', available: true }],
  };
  const trackB: Track = {
    id: '2',
    title: 'Teeth (Slowed + Reverb)',
    artist: 'PureSnow',
    featuredArtists: [],
    album: 'Teeth',
    artworkUrl: '',
    duration: 175,
    versionType: 'slowed',
    playback: { isStreamable: true, streamType: 'full', streamUrl: '/audio/horns.mp3', source: 'soundcloud', quality: '128kbps', externalUrl: '' },
    sources: [{ platform: 'soundcloud', id: '2', url: '', available: true }],
  };

  assert.equal(shouldDeduplicate(trackA, trackB), false);
});

test('deduplicateAndRank merges sources and ranks by relevance', () => {
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Resonance',
      artist: 'HOME',
      featuredArtists: [],
      album: 'Odyssey',
      artworkUrl: '',
      duration: 212,
      versionType: 'original',
      isrc: 'FR6V81451234',
      playback: { isStreamable: true, streamType: 'full', streamUrl: '/audio/outfoxing.mp3', source: 'deezer', quality: '320kbps', externalUrl: '' },
      sources: [{ platform: 'deezer', id: 'd1', url: '', available: true }],
    },
    {
      id: '2',
      title: 'Resonance',
      artist: 'HOME',
      featuredArtists: [],
      album: 'Odyssey',
      artworkUrl: '',
      duration: 212,
      versionType: 'original',
      isrc: 'FR6V81451234',
      playback: { isStreamable: true, streamType: 'preview', streamUrl: 'https://preview.url', source: 'apple', quality: '256kbps', externalUrl: '' },
      sources: [{ platform: 'apple', id: 'a1', url: '', available: true }],
    },
    {
      id: '3',
      title: 'Different Song',
      artist: 'Other',
      featuredArtists: [],
      album: 'Other Album',
      artworkUrl: '',
      duration: 180,
      versionType: 'original',
      playback: { isStreamable: true, streamType: 'full', streamUrl: '/audio/sample_ambient.mp3', source: 'free_archive', quality: '320kbps', externalUrl: '' },
      sources: [{ platform: 'free_archive', id: 'f1', url: '', available: true }],
    },
  ];

  const result = deduplicateAndRank(tracks, 'Resonance');
  assert.equal(result.length, 2);
  assert.equal(result[0].title, 'Resonance');
  assert.equal(result[0].sources.length, 2);
});
