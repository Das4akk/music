import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLRC, findActiveLyricIndex } from './lrcParser.js';

test('parseLRC correctly parses standard timestamped lines', () => {
  const lrc = `
[00:04.20]First line of lyrics
[00:15.80]Second line of song
[01:02.50]Chorus begins here
  `;

  const parsed = parseLRC(lrc);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].text, 'First line of lyrics');
  assert.equal(parsed[0].time, 4.2);
  assert.equal(parsed[1].time, 15.8);
  assert.equal(parsed[2].time, 62.5);
});

test('findActiveLyricIndex returns correct active line based on playback time', () => {
  const lyrics = [
    { time: 5, text: 'Intro' },
    { time: 15, text: 'Verse 1' },
    { time: 30, text: 'Chorus' },
    { time: 60, text: 'Outro' },
  ];

  assert.equal(findActiveLyricIndex(lyrics, 0), 0);
  assert.equal(findActiveLyricIndex(lyrics, 10), 0);
  assert.equal(findActiveLyricIndex(lyrics, 15), 1);
  assert.equal(findActiveLyricIndex(lyrics, 22), 1);
  assert.equal(findActiveLyricIndex(lyrics, 45), 2);
  assert.equal(findActiveLyricIndex(lyrics, 75), 3);
});
