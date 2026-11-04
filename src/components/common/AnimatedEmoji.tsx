import React, { useState } from 'react';

export type EmojiCategory =
  | 'Activity'
  | 'Animals and Nature'
  | 'Food and Drink'
  | 'Objects'
  | 'People'
  | 'Smileys'
  | 'Symbols'
  | 'Travel and Places'
  | 'Flags';

interface AnimatedEmojiProps {
  category: EmojiCategory;
  name: string; // e.g. "Sparkles", "Fire", "Glowing Star", "Heart On Fire", "Locked With Key"
  alt?: string;
  size?: number | string;
  className?: string;
  fallbackText?: string;
}

/**
 * Loads Telegram Animated Emojis directly from official jsDelivr CDN
 * without downloading locally, as specified in COWIO Design System Section 3.
 */
export function AnimatedEmoji({
  category,
  name,
  alt,
  size = 24,
  className = '',
  fallbackText = '✨',
}: AnimatedEmojiProps) {
  const [hasError, setHasError] = useState(false);

  // Encode name for CDN URL (e.g. "Heart On Fire" -> "Heart%20On%20Fire.webp")
  const encodedCategory = encodeURIComponent(category);
  const encodedName = encodeURIComponent(name);
  const cdnUrl = `https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Telegram-Animated-Emojis@main/${encodedCategory}/${encodedName}.webp`;

  if (hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={{ fontSize: typeof size === 'number' ? `${size * 0.75}px` : size }}
        role="img"
        aria-label={alt || name}
      >
        {fallbackText}
      </span>
    );
  }

  const dimensionStyle =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px` }
      : { width: size, height: size };

  return (
    <img
      src={cdnUrl}
      alt={alt || name}
      loading="lazy"
      onError={() => setHasError(true)}
      style={dimensionStyle}
      className={`inline-block object-contain select-none pointer-events-none flex-shrink-0 ${className}`}
    />
  );
}
