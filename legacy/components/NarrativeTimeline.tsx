import React, { useEffect, useState, useRef } from 'react';
import { NarrativeState } from '../types';
import { DURATION_MS, TIMELINE } from '../src/constants';
import { getPhaseAt } from '../src/timeline';

interface NarrativeTimelineProps {
  children: (state: NarrativeState) => React.ReactNode;
  onComplete?: () => void;
}

const NarrativeTimeline: React.FC<NarrativeTimelineProps> = ({ children, onComplete }) => {
  const [state, setState] = useState<NarrativeState>({
    phase: 'SIGNAL',
    elapsed: 0,
    intensity: 0,
  });
  const animationFrameRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    // If we're not in a render mode with pre-set start time, set it now.
    if (!(window as any).__START_TIME__) {
       (window as any).__START_TIME__ = performance.now();
    }
    
    completedRef.current = false;

    const update = () => {
      // Check for forced time override (Seek Mode for screenshots)
      // This allows external scripts to set __CURRENT_TIME__ to control the frame
      const forcedTime = (window as any).__CURRENT_TIME__;
      let elapsedMs: number;

      if (typeof forcedTime === 'number') {
        elapsedMs = forcedTime;
      } else {
        // Standard real-time playback
        const start = (window as any).__START_TIME__;
        if (!start) return; 
        const now = performance.now();
        elapsedMs = now - start;
      }

      // Handle completion (only if natural playback)
      if (typeof forcedTime !== 'number' && elapsedMs >= DURATION_MS && !completedRef.current) {
        completedRef.current = true;
        (window as any).__RENDER_DONE__ = true;
        
        setState({
          phase: 'CLARITY_LOGO',
          elapsed: DURATION_MS,
          intensity: 1,
        });
        if (onComplete) onComplete();
        return;
      }

      // Allow Seek Mode to go beyond duration if requested
      if (typeof forcedTime !== 'number' && elapsedMs > DURATION_MS) {
        return;
      }

      const currentPhase = getPhaseAt(elapsedMs);
      
      const phaseTiming = TIMELINE[currentPhase];
      let intensity = 0;
      
      if (phaseTiming) {
        const duration = phaseTiming.toMs - phaseTiming.fromMs;
        const phaseElapsed = elapsedMs - phaseTiming.fromMs;
        intensity = Math.max(0, Math.min(1, phaseElapsed / duration));
      }

      setState({
        phase: currentPhase,
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
