import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import { NavView } from './Sidebar.js';

interface MobileNavProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
}

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  const items = [
    { id: 'home' as const, label: 'Главная', icon: Home },
    { id: 'search' as const, label: 'Поиск', icon: Search },
    { id: 'library' as const, label: 'Моя музыка', icon: Library },
  ];

  return (
    <nav
      aria-label="Мобильная навигация"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-6 h-16 flex justify-around items-center border-t border-white/14"
      style={{
        background: 'rgba(6, 6, 9, 0.65)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8), 0 1px 0 0 rgba(255, 255, 255, 0.15) inset',
      }}
    >
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-amber-400 font-bold scale-105'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
