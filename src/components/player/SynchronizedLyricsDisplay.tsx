import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../../types/music.js';
import { findActiveLyricIndex } from '../../utils/lrcParser.js';

interface SynchronizedLyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  onSeek: (time: number) => void;
  fontSize?: 'medium' | 'large' | 'xl';
}

export function SynchronizedLyricsDisplay({
  lyrics,
  currentTime,
  onSeek,
  fontSize = 'large',
}: SynchronizedLyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  const activeIndex = findActiveLyricIndex(lyrics, currentTime);

  // Smooth cinematic scroll centering the active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm font-medium">
        <p>♪ Инструментальная композиция ♪</p>
      </div>
    );
  }

  const fontSizeClass =
    fontSize === 'xl'
      ? 'text-2xl md:text-3xl'
      : fontSize === 'medium'
      ? 'text-lg md:text-xl'
      : 'text-xl md:text-2xl';

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto px-4 py-32 space-y-7 focus:outline-none select-none scroll-smooth [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]"
    >
      {lyrics.map((line, index) => {
        const isActive = index === activeIndex;
        const distance = Math.abs(index - activeIndex);

        // Compute relative styling based on distance from center active line
        let opacity = 'opacity-25';
        let blur = 'blur-[1.5px]';
        let scale = 'scale-95';
        let textColor = 'text-white/40';
        let fontWeight = 'font-medium';

        if (isActive) {
          opacity = 'opacity-100';
          blur = 'blur-0';
          scale = 'scale-100';
          textColor = 'text-white';
          fontWeight = 'font-bold tracking-tight';
        } else if (distance === 1) {
          opacity = 'opacity-50';
          blur = 'blur-[0.8px]';
          scale = 'scale-[0.98]';
          textColor = 'text-white/60';
        } else if (distance === 2) {
          opacity = 'opacity-35';
          blur = 'blur-[1.2px]';
          scale = 'scale-[0.96]';
          textColor = 'text-white/40';
        }

        return (
          <div
            key={`${line.time}-${index}`}
            className="flex items-center transition-all duration-500 ease-out"
          >
            <button
              ref={isActive ? activeLineRef : null}
              type="button"
              onClick={() => onSeek(line.time)}
              className={`w-full text-left transition-all duration-500 ease-out cursor-pointer hover:opacity-100 group ${fontSizeClass} ${fontWeight} ${textColor} ${opacity} ${blur} ${scale}`}
              style={{
                textShadow: isActive ? '0 0 30px rgba(255, 255, 255, 0.35)' : 'none',
              }}
              title={`Перемотать на ${Math.floor(line.time / 60)}:${String(Math.floor(line.time % 60)).padStart(2, '0')}`}
            >
              <span className="block leading-snug transition-transform duration-300 group-hover:translate-x-1">
                {line.text}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
