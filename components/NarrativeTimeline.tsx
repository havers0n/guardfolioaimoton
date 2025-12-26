import React, { useEffect, useState, useRef } from 'react';
import { NarrativePhase, NarrativeState } from '../types';
import { NARRATIVE_TIMELINE } from '../constants';

interface NarrativeTimelineProps {
  children: (state: NarrativeState) => React.ReactNode;
  onComplete?: () => void;
}

const NarrativeTimeline: React.FC<NarrativeTimelineProps> = ({ children, onComplete }) => {
  const [state, setState] = useState<NarrativeState>({
    phase: NarrativePhase.DISTORTION,
    elapsed: 0,
    intensity: 0,
  });
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    startTimeRef.current = startTime;

    const update = () => {
      if (!startTimeRef.current) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000; // в секундах

      if (elapsed >= NARRATIVE_TIMELINE.TOTAL_DURATION) {
        setState({
          phase: NarrativePhase.CLARITY,
          elapsed: NARRATIVE_TIMELINE.TOTAL_DURATION * 1000,
          intensity: 1,
        });
        if (onComplete) onComplete();
        return;
      }

      // Определяем текущую фазу
      let currentPhase = NarrativePhase.DISTORTION;
      let phaseStart = 0;
      let phaseEnd = 0;

      for (const [phase, info] of Object.entries(NARRATIVE_TIMELINE.PHASES)) {
        if (elapsed >= info.start && elapsed < info.end) {
          currentPhase = phase as NarrativePhase;
          phaseStart = info.start;
          phaseEnd = info.end;
          break;
        }
      }

      // Вычисляем интенсивность в рамках текущей фазы (0-1)
      const phaseDuration = phaseEnd - phaseStart;
      const phaseElapsed = elapsed - phaseStart;
      const intensity = Math.max(0, Math.min(1, phaseElapsed / phaseDuration));

      setState({
        phase: currentPhase,
        elapsed: elapsed * 1000, // в миллисекундах
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

