import React from 'react';
import { NarrativePhase } from '../types';
import NoiseLayer from './NoiseLayer';

interface VisualEffectsProps {
  phase: NarrativePhase;
  intensity: number; // 0-1
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ phase, intensity }) => {
  return (
    <>
      {/* Наложение шума для фаз DISTORTION и TENSION */}
      {(phase === NarrativePhase.DISTORTION || phase === NarrativePhase.TENSION) && (
        <NoiseLayer intensity={intensity} opacity={0.5} />
      )}

      {/* Эффект разрыва для фазы TENSION */}
      {phase === NarrativePhase.TENSION && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 40,
            opacity: intensity * 0.6,
            background: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(239, 68, 68, ${intensity * 0.3}) 48%, 
                transparent 52%, 
                transparent 100%
              ),
              linear-gradient(0deg, 
                transparent 0%, 
                rgba(239, 68, 68, ${intensity * 0.2}) 48%, 
                transparent 52%, 
                transparent 100%
              )
            `,
            transform: `translate(${Math.sin(Date.now() / 50) * intensity * 5}px, ${Math.cos(Date.now() / 70) * intensity * 5}px)`,
          }}
        />
      )}

      {/* Glitch эффект для фаз DISTORTION и TENSION */}
      {(phase === NarrativePhase.DISTORTION || phase === NarrativePhase.TENSION) && (
        <>
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 45,
              opacity: intensity * 0.3,
              clipPath: `inset(${50 - intensity * 10}% 0 ${50 + intensity * 10}% 0)`,
              transform: `translateX(${Math.sin(Date.now() / 100) * intensity * 10}px)`,
              mixBlendMode: 'screen',
              background: 'rgba(239, 68, 68, 0.8)',
            }}
          />
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: 45,
              opacity: intensity * 0.3,
              clipPath: `inset(${50 + intensity * 10}% 0 ${50 - intensity * 10}% 0)`,
              transform: `translateX(${-Math.sin(Date.now() / 100) * intensity * 10}px)`,
              mixBlendMode: 'screen',
              background: 'rgba(59, 130, 246, 0.8)',
            }}
          />
        </>
      )}
    </>
  );
};

export default VisualEffects;

