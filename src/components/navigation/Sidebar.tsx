import React from 'react';
import { Home, Search, Library, Radio } from 'lucide-react';
import { AnimatedEmoji } from '../common/AnimatedEmoji.js';

export type NavView = 'home' | 'search' | 'library';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView, payload?: unknown) => void;
  brandName?: string;
  onStartFlow: () => void;
}

export function Sidebar({
  currentView,
  onNavigate,
  brandName = 'Aetheria Music',
  onStartFlow,
}: SidebarProps) {
  const navItems = [
    { id: 'home' as const, label: 'Главная', icon: Home },
    { id: 'search' as const, label: 'Поиск', icon: Search },
    { id: 'library' as const, label: 'Моя музыка', icon: Library },
  ];

  return (
    <aside
      aria-label="Основная навигация"
      className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-screen z-30 select-none border-r border-white/10 pb-28"
      style={{
        background: 'rgba(6, 6, 9, 0.55)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.8), 1px 0 0 0 rgba(255, 255, 255, 0.08) inset',
      }}
    >
      {/* Brand Header */}
      <div className="p-6 pb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500/80 to-orange-600/80 p-[1px] flex items-center justify-center shadow-lg shadow-orange-500/20">
          <div className="w-full h-full bg-[#0a0c10] rounded-[15px] flex items-center justify-center">
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white block">
            {brandName}
          </span>
          <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
            Audio Platform
          </span>
        </div>
      </div>

      {/* Main Nav Links (Strictly 3 essential sections per requirement 5) */}
      <nav className="flex-1 px-3 space-y-1.5 mt-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-white/12 text-white font-semibold border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.2)_inset]'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-white/40'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Quick "Моя волна" launcher with COWIO frosted glass & Animated Emoji */}
        <div className="pt-6 px-1">
          <button
            type="button"
            onClick={onStartFlow}
            className="w-full flex items-center gap-3 p-3.5 rounded-[20px] transition-all group cursor-pointer text-left"
            style={{
              background: 'rgba(6, 6, 9, 0.45)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 18px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <AnimatedEmoji
                category="Activity"
                name="Sparkles"
                size={20}
                fallbackText="✨"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                Моя волна
              </div>
              <div className="text-[10px] text-white/40 truncate">Бесконечный поток</div>
            </div>
          </button>
        </div>
      </nav>

      {/* Clean Bottom Status pill in COWIO glass */}
      <div className="px-3">
        <div
          className="p-3.5 rounded-[18px] flex items-center justify-between"
          style={{
            background: 'rgba(6, 6, 9, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Lossless Stream
          </div>
          <span className="text-[10px] font-mono text-white/30">FLAC / 320k</span>
        </div>
      </div>
    </aside>
  );
}
