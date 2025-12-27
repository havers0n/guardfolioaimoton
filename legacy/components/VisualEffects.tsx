import React from 'react';
import { getMacroPhaseAt } from '../src/timeline';
import NoiseLayer from './NoiseLayer';

interface VisualEffectsProps {
  elapsed: number;
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ elapsed }) => {
  const macroPhase = getMacroPhaseAt(elapsed);
  
  // Define intensity based on macro phase
  let noiseOpacity = 0;
  let scanlineOpacity = 0;
  
  switch (macroPhase) {
    case 'SIGNAL':
      // Very clean, minimal noise
      noiseOpacity = 0.05; 
      break;
    case 'INTERPRETATION':
      // Processing - increased noise, scanlines
      noiseOpacity = 0.08;
      scanlineOpacity = 0.05;
      break;
    case 'STRUCTURE':
      // Building - tech feel
      noiseOpacity = 0.06;
      scanlineOpacity = 0.03;
      break;
    case 'CLARITY':
      // Crystal clear
      noiseOpacity = 0.02;
      scanlineOpacity = 0;
      break;
  }

  // Fade out scanlines at the very end of Clarity (25s duration)
  if (elapsed > 25000) {
    noiseOpacity = 0;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <NoiseLayer intensity={1} opacity={noiseOpacity} />
      
      {/* Scanlines */}
      {scanlineOpacity > 0 && (
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
            backgroundSize: '100% 4px',
            opacity: scanlineOpacity,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Vignette - always present but subtle */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(11,17,32,0.6) 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default VisualEffects;
