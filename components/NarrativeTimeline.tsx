import React, { useEffect, useState, useRef } from 'react';
import { NarrativeState } from '../types';
import { DURATION_MS, PHASES } from '../src/constants';
import { getPhaseAt } from '../src/timeline';

interface NarrativeTimelineProps {
  children: (state: NarrativeState) => React.ReactNode;
  onComplete?: () => void;
}

const NarrativeTimeline: React.FC<NarrativeTimelineProps> = ({ children, onComplete }) => {
  const [state, setState] = useState<NarrativeState>({
    phase: PHASES[0].phase,
    elapsed: 0,
    intensity: 0,
  });
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    startTimeRef.current = startTime;
    completedRef.current = false;

    const update = () => {
      if (!startTimeRef.current) return;

      const elapsedMs = Date.now() - startTimeRef.current;

      // Сигнал завершения для headless рендеринга (Playwright)
      if (elapsedMs >= DURATION_MS && !completedRef.current) {
        completedRef.current = true;
        (window as any).__RENDER_DONE__ = true;
        
        const phaseInfo = getPhaseAt(DURATION_MS);
        setState({
          phase: phaseInfo.phase,
          elapsed: DURATION_MS,
          intensity: 1,
        });
        if (onComplete) onComplete();
        return;
      }

      if (elapsedMs >= DURATION_MS) {
        return;
      }

      // Используем функции из timeline.ts
      const phaseInfo = getPhaseAt(elapsedMs);
      const currentPhaseData = PHASES.find(p => p.phase === phaseInfo.phase);
      
      if (!currentPhaseData) {
        animationFrameRef.current = requestAnimationFrame(update);
        return;
      }

      // Вычисляем интенсивность в рамках текущей фазы (0-1)
      const phaseDuration = currentPhaseData.toMs - currentPhaseData.fromMs;
      const phaseElapsed = phaseInfo.tMs - currentPhaseData.fromMs;
      const intensity = Math.max(0, Math.min(1, phaseElapsed / phaseDuration));

      setState({
        phase: phaseInfo.phase,
        elapsed: elapsedMs,
        intensity,
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onComplete]);

  return <>{children(state)}</>;
};

export default NarrativeTimeline;

