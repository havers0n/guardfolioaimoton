/**
 * OverlayText - React-компонент для narrative overlay текста.
 * Упрощенная версия для витрины Storybook.
 */

import React from 'react';
import type { TimelineState } from '../../../engine/timelineSpec';

export interface OverlayTextProps {
  state: TimelineState;
  width?: number;
  height?: number;
}

export const OverlayText: React.FC<OverlayTextProps> = ({ state, width = 1920, height = 1080 }) => {
  const scale = Math.min(width / 1920, height / 1080);
  const fontSize = 48 * scale;
  const centerX = width / 2;
  const safeBottom = Math.max(64, height * 0.10);
  const grid = 16 * (width / 1920);
  const y = height - safeBottom - grid * 4;

  if (!state.narrativeText) {
    return null;
  }

  // Fade in/out logic (упрощенно)
  const opacity = state.narrativeText ? 1 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: width * 0.8,
        textAlign: 'center',
        color: '#cbd5e1', // slate-300
        fontSize: `${fontSize}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        letterSpacing: '-0.02em',
        opacity,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }}
    >
      {state.narrativeText}
    </div>
  );
};

