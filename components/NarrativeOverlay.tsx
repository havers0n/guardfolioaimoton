import React, { useEffect, useState } from 'react';
import { Phase, PHASES } from '../src/constants';
import { getPhaseAt } from '../src/timeline';

interface NarrativeOverlayProps {
  phase: Phase;
  elapsed: number;
}

const NarrativeOverlay: React.FC<NarrativeOverlayProps> = ({ phase, elapsed }) => {
  const [isVisible, setIsVisible] = useState(false);
  const phaseInfo = getPhaseAt(elapsed);

  useEffect(() => {
    const currentPhaseData = PHASES.find(p => p.phase === phase);
    if (!currentPhaseData) {
      setIsVisible(false);
      return;
    }

    const phaseStart = currentPhaseData.fromMs;
    const phaseEnd = currentPhaseData.toMs;
    const phaseDuration = phaseEnd - phaseStart;
    const phaseElapsed = elapsed - phaseStart;

    // Для фазы CLARITY скрываем текст раньше, чтобы освободить место для логотипа
    const hideBeforeEnd = phase === "CLARITY" ? 2000 : 500; // За 2 секунды до конца для CLARITY, 500мс для остальных

    // Показываем текст с задержкой и держим его видимым
    if (phaseElapsed >= 300 && phaseElapsed < phaseDuration - hideBeforeEnd) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [phase, elapsed]);

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
          {phaseInfo.phaseText}
        </h2>
      </div>
    </div>
  );
};

export default NarrativeOverlay;

