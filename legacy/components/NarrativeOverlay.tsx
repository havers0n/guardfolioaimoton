import React from 'react';
import { getNarrativeWindow } from '../src/timeline';

interface NarrativeOverlayProps {
  elapsed: number;
  phase?: any;
}

const NarrativeOverlay: React.FC<NarrativeOverlayProps> = ({ elapsed }) => {
  const currentWindow = getNarrativeWindow(elapsed);
  
  if (!currentWindow) return null;

  // Fade in/out logic
  const FADE_MS = 300; 
  const timeInWindow = elapsed - currentWindow.start;
  const timeUntilEnd = currentWindow.end - elapsed;
  
  let opacity = 1;
  if (timeInWindow < FADE_MS) {
    opacity = timeInWindow / FADE_MS;
  } else if (timeUntilEnd < FADE_MS) {
    opacity = timeUntilEnd / FADE_MS;
  }

  // Floating typography without plates
  // Positioned in lower third to avoid center UI
  return (
    <div
      className="absolute inset-0 flex flex-col justify-end items-center pointer-events-none pb-[15vh]"
      style={{
        zIndex: 50,
        opacity: Math.max(0, opacity),
      }}
    >
      <div 
        className="px-4 text-center"
        style={{
          maxWidth: '800px',
          transform: `scale(${0.95 + opacity * 0.05})`,
        }}
      >
        <h2
          className="text-3xl sm:text-5xl font-medium tracking-tight"
          style={{
            color: 'rgba(203, 213, 225, 0.85)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 16px rgba(59, 130, 246, 0.15)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          {currentWindow.text}
        </h2>
      </div>
    </div>
  );
};

export default NarrativeOverlay;
