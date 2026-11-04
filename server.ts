import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MusicSearchService } from './server/services/musicSearchService.js';
import { DbStore } from './server/services/dbStore.js';
import { parseLRC } from './src/utils/lrcParser.js';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Static serving for local high-fidelity audio streams
  const publicAudioPath = path.resolve(__dirname, 'public/audio');
  app.use('/audio', express.static(publicAudioPath, {
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'audio/mpeg');
    },
  }));

  const searchService = new MusicSearchService();
  const db = new DbStore();

  // Audio Stream Proxy with Byte-Range support (206 Partial Content), CORS headers and format verification
  app.get('/api/stream', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
      return res.status(400).json({ error: 'Valid HTTP/HTTPS stream URL is required' });
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const upstream = await fetch(rawUrl, {
        headers,
        redirect: 'follow',
      });

      if (!upstream.ok && upstream.status !== 206) {
        return res.status(upstream.status).json({
          error: `Upstream source returned HTTP ${upstream.status}`,
          url: rawUrl,
        });
      }

      const rawContentType = upstream.headers.get('content-type') || 'audio/mpeg';
      // Detect error responses masquerading as 200 (HTML/XML error pages)
      if (rawContentType.includes('text/html') || rawContentType.includes('application/xml')) {
        return res.status(502).json({
          error: 'Upstream returned invalid non-audio payload (HTML/XML error)',
          contentType: rawContentType,
        });
      }

      res.status(upstream.status);
      res.setHeader('Content-Type', rawContentType.startsWith('audio/') ? rawContentType : 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const contentRange = upstream.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      if (upstream.body) {
        // @ts-expect-error Readable.fromWeb supports web streams in Node 18+
        Readable.fromWeb(upstream.body).pipe(res);
      } else {
        res.end();
      }
    } catch (err: unknown) {
      console.error('Stream proxy error:', err);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to proxy audio stream' });
      }
    }
  });

  // Source pre-validator API to inspect stream status without triggering media element error
  app.get('/api/audio/validate', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!rawUrl) return res.status(400).json({ ok: false, error: 'URL required' });

    if (rawUrl.startsWith('/audio/')) {
      return res.json({
        ok: true,
        source: 'local_storage',
        contentType: 'audio/mpeg',
        isRangeSupported: true,
      });
    }

    try {
      const resp = await fetch(rawUrl, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-100',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });

      const contentType = resp.headers.get('content-type') || '';
      const isAudio = contentType.startsWith('audio/') || contentType.includes('octet-stream');
      const isOk = (resp.status >= 200 && resp.status < 400) && isAudio;

      res.json({
        ok: isOk,
        status: resp.status,
        contentType,
        contentLength: resp.headers.get('content-length'),
        isRangeSupported: !!resp.headers.get('accept-ranges') || resp.status === 206,
        finalUrl: resp.url,
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      res.json({
        ok: false,
        error: err.message || 'Validation request failed',
      });
    }
  });

  // Search API
  app.get('/api/search', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
      const version = typeof req.query.version === 'string' ? req.query.version : undefined;
      const onlyStreamable = req.query.streamable === 'true';

      // Save valid searches to recent searches
      if (q.trim().length >= 2) {
        db.addRecentSearch(q.trim());
      }

      const results = await searchService.search({
        query: q,
        platform,
        version,
        onlyStreamable,
      });

      res.json(results);
    } catch (err) {
      console.error('Search error:', err);
      res.status(500).json({ error: 'Search failed', tracks: [] });
    }
  });

  // Recent Searches API
  app.get('/api/searches/recent', (_req, res) => {
    res.json(db.getRecentSearches());
  });

  app.post('/api/searches/recent', (req, res) => {
    const q = req.body?.query;
    if (typeof q === 'string' && q.trim()) {
      const list = db.addRecentSearch(q);
      return res.json(list);
    }
    res.json(db.getRecentSearches());
  });

  app.delete('/api/searches/recent', (_req, res) => {
    db.clearRecentSearches();
    res.json({ success: true });
  });

  // Home Screen Feeds (Constructed EXCLUSIVELY from actual user activity)
  app.get('/api/home', (_req, res) => {
    try {
      const favorites = db.getFavorites();
      const history = db.getHistory().map(h => h.track);
      const recentSearches = db.getRecentSearches();
      const playlists = db.getPlaylists();

      res.json({
        favorites,
        recentlyPlayed: history,
        recentSearches,
        playlists,
      });
    } catch (err) {
      console.error('Home feed error:', err);
      res.status(500).json({ error: 'Failed to load home feed' });
    }
  });

  // Single Track Details
  app.get('/api/tracks/:id', (req, res) => {
    const track = searchService.getTrackById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  });

  // On-Demand Lazy Lyrics Lookup API (searches verified metadata via LRCLIB)
  app.get('/api/lyrics', async (req, res) => {
    const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';
    const duration = typeof req.query.duration === 'string' ? parseFloat(req.query.duration) : 0;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    try {
      const cleanTitle = title
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/ft\.?|feat\.?|prod\.?/gi, '')
        .replace(/[-_]/g, ' ')
        .trim();
      const cleanArtist = artist
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .trim();

      // Helper to parse data into lines
      const extractLyrics = (data: { syncedLyrics?: string; plainLyrics?: string }) => {
        if (data.syncedLyrics && data.syncedLyrics.trim().length > 0) {
          const lines = parseLRC(data.syncedLyrics);
          if (lines.length > 0) {
            return { isSynced: true, lines, provider: 'LRCLIB Synced' };
          }
        }
        if (data.plainLyrics && data.plainLyrics.trim().length > 0) {
          const plainLines = data.plainLyrics
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean)
            .map((text, idx) => ({ time: idx * 4, text }));
          if (plainLines.length > 0) {
            return { isSynced: false, lines: plainLines, provider: 'LRCLIB Plain' };
          }
        }
        return null;
      };

      // 1. First Tier: Exact metadata match (never send truncated 30s preview duration)
      try {
        const getParams = new URLSearchParams({
          track_name: cleanTitle,
          artist_name: cleanArtist,
        });
        if (duration && duration > 45) {
          getParams.append('duration', Math.round(duration).toString());
        }

        const getRes = await fetch(`https://lrclib.net/api/get?${getParams.toString()}`, {
          signal: AbortSignal.timeout(4000),
          headers: { 'User-Agent': 'AetheriaMusic/1.0' },
        });

        if (getRes.ok) {
          const data = (await getRes.json()) as { syncedLyrics?: string; plainLyrics?: string };
          const result = extractLyrics(data);
          if (result) return res.json(result);
        }
      } catch {}

      // 2. Second Tier: LRCLIB Search endpoint with query fallback
      try {
        const searchRes = await fetch(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`,
          {
            signal: AbortSignal.timeout(4000),
            headers: { 'User-Agent': 'AetheriaMusic/1.0' },
          }
        );

        if (searchRes.ok) {
          const list = (await searchRes.json()) as Array<{
            trackName: string;
            artistName: string;
            syncedLyrics?: string;
            plainLyrics?: string;
          }>;

          if (Array.isArray(list) && list.length > 0) {
            // Find best matching entry that has lyrics
            const match = list.find(item => item.syncedLyrics || item.plainLyrics);
            if (match) {
              const result = extractLyrics(match);
              if (result) return res.json(result);
            }
          }
        }
      } catch {}

      // Clean, unambiguous not-found response (NEVER tells user to manually search)
      return res.json({
        isSynced: false,
        lines: [],
        notFound: true,
        message: 'Текст для этой песни пока не найден в открытой базе',
      });
    } catch {
      return res.json({
        isSynced: false,
        lines: [],
        notFound: true,
        message: 'Текст для этой песни пока не найден в открытой базе',
      });
    }
  });

  // Playlists API
  app.get('/api/playlists', (_req, res) => {
    res.json(db.getPlaylists());
  });

  app.post('/api/playlists', (req, res) => {
    const { title, description, coverUrl } = req.body;
    const newPl = db.createPlaylist(title, description, coverUrl);
    res.status(201).json(newPl);
  });

  app.post('/api/playlists/:id/tracks', (req, res) => {
    const { track } = req.body;
    const success = db.addTrackToPlaylist(req.params.id, track);
    res.json({ success });
  });

  app.delete('/api/playlists/:id/tracks/:trackId', (req, res) => {
    const success = db.removeTrackFromPlaylist(req.params.id, req.params.trackId);
    res.json({ success });
  });

  app.delete('/api/playlists/:id', (req, res) => {
    const success = db.deletePlaylist(req.params.id);
    res.json({ success });
  });

  // Favorites API
  app.get('/api/favorites', (_req, res) => {
    res.json(db.getFavorites());
  });

  app.post('/api/favorites/toggle', (req, res) => {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Missing track' });
    const isFav = db.toggleFavorite(track);
    res.json({ isFavorite: isFav });
  });

  // History API
  app.get('/api/history', (_req, res) => {
    res.json(db.getHistory().map(h => h.track));
  });

  app.post('/api/history', (req, res) => {
    const { track } = req.body;
    if (track) {
      db.addToHistory(track);
    }
    res.json({ success: true });
  });

  // Settings API
  app.get('/api/settings', (_req, res) => {
    res.json(db.getSettings());
  });

  app.post('/api/settings', (req, res) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  // Vite middleware in dev or static files in prod
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aetheria Music server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
