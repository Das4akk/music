import React, { useState, useEffect } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext.js';
import { Sidebar, NavView } from './components/navigation/Sidebar.js';
import { MobileNav } from './components/navigation/MobileNav.js';
import { HomeView } from './components/views/HomeView.js';
import { SearchView } from './components/views/SearchView.js';
import { LibraryView } from './components/views/LibraryView.js';
import { BottomPlayerBar } from './components/player/BottomPlayerBar.js';
import { FullscreenReferencePlayer } from './components/player/FullscreenReferencePlayer.js';
import { Playlist } from './types/music.js';

function MainAppContent() {
  const [currentView, setCurrentView] = useState<NavView>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [brandName, setBrandName] = useState<string>('Aetheria Music');

  const { playTrack, queue, favorites, history } = usePlayer();

  // Load playlists from backend API
  useEffect(() => {
    fetch('/api/playlists')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlaylists(data);
      })
      .catch(() => {});
  }, []);

  // Handle URL query parameters (e.g. ?q=... or ?v=search)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    if (qParam) {
      setSearchInitialQuery(qParam);
      setCurrentView('search');
    }
  }, []);

  const handleNavigate = (view: NavView, payload?: unknown) => {
    setCurrentView(view);
    if (view === 'search' && typeof payload === 'string') {
      setSearchInitialQuery(payload);
    }
  };

  const handleSelectPlaylistFromHome = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentView('library');
  };

  const handleCreatePlaylist = async (title: string, description: string, coverUrl?: string) => {
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, coverUrl }),
      });
      if (res.ok) {
        const newPl = (await res.json()) as Playlist;
        setPlaylists(prev => [newPl, ...prev]);
        setSelectedPlaylistId(newPl.id);
        setCurrentView('library');
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (selectedPlaylistId === id) {
        setSelectedPlaylistId(null);
      }
    } catch {}
  };

  const handleStartFlow = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    } else if (history.length > 0) {
      playTrack(history[0], history);
    } else if (playlists.length > 0 && playlists[0].tracks.length > 0) {
      playTrack(playlists[0].tracks[0], playlists[0].tracks);
    } else if (queue.length > 0) {
      playTrack(queue[0], queue);
    } else {
      setCurrentView('search');
    }
  };

  return (
    <div className="min-h-screen cowio-ambient-bg text-[#f3f4f6] flex flex-col antialiased">
      {/* Sidebar Navigation for Desktop (Strictly 3 main sections: Home, Search, Library) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        brandName={brandName}
        onStartFlow={handleStartFlow}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 md:pl-64 flex flex-col">
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 pt-6 pb-36 md:pb-28">
          {currentView === 'home' && (
            <HomeView
              playlists={playlists}
              onSelectPlaylist={handleSelectPlaylistFromHome}
              onNavigateToSearch={query => {
                setSearchInitialQuery(query || '');
                setCurrentView('search');
              }}
            />
          )}

          {currentView === 'search' && (
            <SearchView initialQuery={searchInitialQuery} />
          )}

          {currentView === 'library' && (
            <LibraryView
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              onSelectPlaylist={setSelectedPlaylistId}
              onCreatePlaylist={handleCreatePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              brandName={brandName}
              onUpdateBrandName={setBrandName}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Strictly 3 tabs: Home, Search, Library) */}
      <MobileNav
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Persistent Bottom Player Bar */}
      <BottomPlayerBar />

      {/* Fullscreen Reference Player (Cinematic Mode) */}
      <FullscreenReferencePlayer />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <MainAppContent />
    </PlayerProvider>
  );
}
