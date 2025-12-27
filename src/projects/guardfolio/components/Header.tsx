/**
 * Header - React-компонент для динамического заголовка.
 * Упрощенная версия для витрины Storybook.
 */

import React from 'react';
import type { TimelineState } from '../../../engine/timelineSpec';

export interface HeaderProps {
  state: TimelineState;
  width?: number;
  height?: number;
}

export const Header: React.FC<HeaderProps> = ({ state, width = 1920, height = 1080 }) => {
  const scale = Math.min(width / 1920, height / 1080);
  const fontSize = 32 * scale;
  const safeTop = Math.max(64, height * 0.08);
  const grid = 16 * (width / 1920);
  const x = Math.max(48, width * 0.06);
  const y = safeTop + grid * 1;

  // Применяем UI transforms
  const opacity = state.uiOpacity;
  const headerScale = state.uiScale;
  const blur = state.uiBlur;

  if (!state.dynamicHeader) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        color: '#e2e8f0', // slate-200
        fontSize: `${fontSize}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.01em',
        opacity,
        transform: `scale(${headerScale})`,
        transformOrigin: 'top left',
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease',
        pointerEvents: 'none',
      }}
    >
      {state.dynamicHeader}
    </div>
  );
};

