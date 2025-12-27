import React, { useEffect, useState } from 'react';
import { Phase, PHASES, TIMELINE } from '../src/constants';
import { getPhaseAt } from '../src/timeline';

interface NarrativeOverlayProps {
  phase: Phase;
  elapsed: number;
}

const NarrativeOverlay: React.FC<NarrativeOverlayProps> = ({ phase, elapsed }) => {
  const [opacity, setOpacity] = useState(0);
  const phaseInfo = getPhaseAt(elapsed);

  useEffect(() => {
    const currentPhaseData = PHASES.find(p => p.phase === phase);
    if (!currentPhaseData || !currentPhaseData.text) {
      // Не показываем текст для фазы HOOK (пустая строка)
      setOpacity(0);
      return;
    }

    const phaseStart = currentPhaseData.fromMs;
    const phaseEnd = currentPhaseData.toMs;
    const phaseDuration = phaseEnd - phaseStart;
    const phaseElapsed = elapsed - phaseStart;

    const fadeInMs = TIMELINE.FADE_IN_MS;
    const fadeOutMs = TIMELINE.FADE_OUT_MS;

    // Для фазы CLARITY скрываем текст раньше, чтобы освободить место для логотипа
    const hideBeforeEnd = phase === "CLARITY" ? 2000 : 0;

    // Fade-in период
    if (phaseElapsed < fadeInMs) {
      setOpacity(phaseElapsed / fadeInMs);
    }
    // Hold период (основное время фазы)
    else if (phaseElapsed < phaseDuration - fadeOutMs - hideBeforeEnd) {
      setOpacity(1);
    }
    // Fade-out период
    else if (phaseElapsed < phaseDuration - hideBeforeEnd) {
      const fadeOutStart = phaseDuration - fadeOutMs - hideBeforeEnd;
      const fadeOutProgress = (phaseElapsed - fadeOutStart) / fadeOutMs;
      setOpacity(1 - fadeOutProgress);
    }
    // Скрыто
    else {
      setOpacity(0);
    }
  }, [phase, elapsed]);

  // Не показываем компонент если нет текста или opacity = 0
  if (!phaseInfo.phaseText || opacity === 0) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        zIndex: 60,
        opacity: opacity,
        transition: `opacity ${TIMELINE.FADE_IN_MS}ms ease-in, opacity ${TIMELINE.FADE_OUT_MS}ms ease-out`,
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

