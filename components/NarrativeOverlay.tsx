import React, { useEffect, useState } from 'react';
import { NarrativePhase } from '../types';
import { NARRATIVE_TIMELINE } from '../constants';

interface NarrativeOverlayProps {
  phase: NarrativePhase;
  elapsed: number;
}

const NarrativeOverlay: React.FC<NarrativeOverlayProps> = ({ phase, elapsed }) => {
  const [isVisible, setIsVisible] = useState(false);
  const phaseInfo = NARRATIVE_TIMELINE.PHASES[phase];

  useEffect(() => {
    const phaseStart = phaseInfo.start * 1000;
    const phaseEnd = phaseInfo.end * 1000;
    const phaseDuration = phaseEnd - phaseStart;
    const phaseElapsed = elapsed - phaseStart;

    // Показываем текст с задержкой и держим его видимым
    if (phaseElapsed >= 300 && phaseElapsed < phaseDuration - 500) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [phase, elapsed, phaseInfo]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 60,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      <div className="text-center px-8">
        <h2
          className="text-4xl sm:text-6xl font-bold text-white tracking-tight"
          style={{
            textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.05em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {phaseInfo.message}
        </h2>
      </div>
    </div>
  );
};

export default NarrativeOverlay;

