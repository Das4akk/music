import React, { useState } from 'react';
import { Playlist } from '../../types/music.js';
import { Plus, ListMusic, Play, Trash2 } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onSelectPlaylist: (id: string) => void;
  onCreatePlaylist: (title: string, description: string, coverUrl?: string) => void;
  onDeletePlaylist?: (id: string) => void;
}

export function PlaylistsView({
  playlists,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
}: PlaylistsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle, newDesc, newCover || undefined);
    setNewTitle('');
    setNewDesc('');
    setNewCover('');
    setIsModalOpen(false);
  };

  const presetCovers = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Плейлисты
          </h1>
          <p className="text-xs md:text-sm text-white/50 mt-1">
            Коллекции и тематические сборники любимых композиций.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-white text-black font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Новый плейлист
        </button>
      </div>

      {/* Grid of Playlists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {playlists.map(pl => (
          <div
            key={pl.id}
            onClick={() => onSelectPlaylist(pl.id)}
            className="group relative p-4 rounded-3xl bg-[#13151a] hover:bg-[#1a1c22] border border-white/5 hover:border-white/15 transition-all cursor-pointer shadow-lg hover:-translate-y-1"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-3.5 border border-white/10">
              <img
                src={pl.coverUrl}
                alt={pl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-3">
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
              {pl.title}
            </h3>
            <p className="text-xs text-white/50 line-clamp-2 mt-1">{pl.description}</p>
            <div className="text-[11px] font-mono text-white/30 mt-3 flex items-center justify-between">
              <span>{pl.tracks.length} композиций</span>
              {pl.isDefault && (
                <span className="text-amber-400 font-semibold">Кураторский</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PLAYLIST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#16181f] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Создать новый плейлист</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например, Night Drive Vol. 1"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-1">
                  Описание (необязательно)
                </label>
                <textarea
                  rows={2}
                  placeholder="Коротко о настроении плейлиста..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-1.5">
                  Выберите обложку
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presetCovers.map((cov, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewCover(cov)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        newCover === cov ? 'border-amber-400 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={cov} alt="Preset cover" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow transition-all cursor-pointer"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
