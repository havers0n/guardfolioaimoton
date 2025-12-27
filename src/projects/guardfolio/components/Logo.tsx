/**
 * Logo - React-компонент для финального логотипа бренда.
 * Упрощенная версия для витрины Storybook.
 */

import React from 'react';
import type { TimelineState } from '../../../engine/timelineSpec';
import { BRAND, TAGLINE } from '../../../constants';

export interface LogoProps {
  state: TimelineState;
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ state, width = 1920, height = 1080 }) => {
  const scale = Math.min(width / 1920, height / 1080);
  const fontSize = 48 * scale * 1.5; // Увеличенный H1
  const taglineFontSize = 16 * scale;
  const centerX = width / 2;
  const safeBottom = Math.max(64, height * 0.10);
  const grid = 16 * (width / 1920);
  const y = height - safeBottom - grid * 6;

  const progress = state.brandProgress;
  if (progress <= 0) {
    return null;
  }

  // Easing function
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedP = easeOut(progress);

  // Growth Animation: Start from scale 0.5
  const logoScale = 0.5 + 0.5 * easedP; // 0.5 -> 1.0
  const opacity = progress; // 0 -> 1

  // Tagline appears after 30% of progress
  const taglineP = Math.max(0, (progress - 0.3) / 0.7);
  const taglineOpacity = easeOut(taglineP) * 0.9;

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: y,
        transform: `translate(-50%, -50%) scale(${logoScale})`,
        opacity,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Brand text with gradient */}
      <div
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.02em',
          marginBottom: `${grid * 1.25}px`,
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {BRAND}
      </div>

      {/* Tagline text */}
      <div
        style={{
          color: '#cbd5e1', // slate-300 (светлее для лучшей видимости)
          fontSize: `${taglineFontSize}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 300,
          letterSpacing: '0.02em',
          opacity: taglineOpacity,
          transition: 'opacity 0.3s ease',
        }}
      >
        {TAGLINE}
      </div>

      {/* Decorative blobs (упрощенно) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${192 * scale}px`,
          height: `${192 * scale}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          filter: 'blur(48px)',
          opacity: Math.min(0.6, progress * 0.6),
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </div>
  );
};

