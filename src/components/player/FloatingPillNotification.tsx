import React from 'react';
import { Track } from '../../types/music.js';
import { Disc3, Radio } from 'lucide-react';
import { AnimatedEmoji } from '../common/AnimatedEmoji.js';

interface FloatingPillNotificationProps {
  track: Track | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export function FloatingPillNotification({
  track,
  currentTime,
  duration,
  isPlaying,
}: FloatingPillNotificationProps) {
  if (!track) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="relative group transition-all duration-300">
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-[16px] max-w-[380px] md:max-w-[440px] transition-all"
        style={{
          background: 'rgba(6, 6, 9, 0.45)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          boxShadow:
            '0 18px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 1px 0 0 rgba(255, 255, 255, 0.2) inset',
        }}
      >
        {/* Left Circular Icon / Mini artwork */}
        <div className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-neutral-900 border border-white/14 flex items-center justify-center">
          {track.artworkUrl ? (
            <img
              src={track.artworkUrl}
              alt={track.title}
              className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}
            />
          ) : (
            <Disc3 className="w-4 h-4 text-white/70" />
          )}
          {isPlaying && (
            <span className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px] pointer-events-none" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between text-[10px] tracking-wider uppercase font-mono text-white/40 leading-tight">
            <span className="truncate">{track.versionType !== 'original' ? track.versionType.replace('_', ' ') : 'STREAMING'}</span>
            <span className="text-amber-400 font-medium">{track.playback.quality.split(' ')[0]}</span>
          </div>
          <div className="text-xs font-semibold text-white truncate leading-tight mt-0.5">
            {track.title} <span className="font-normal text-white/50">· {track.artist}</span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right Indicator with subtle animated icon */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
          {isPlaying ? (
            <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
          ) : (
            <AnimatedEmoji category="Animals and Nature" name="Glowing Star" size={14} fallbackText="⭐" />
          )}
        </div>
      </div>
    </div>
  );
}
