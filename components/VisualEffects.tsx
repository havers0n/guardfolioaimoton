import React from 'react';
import { Phase } from '../src/constants';
import NoiseLayer from './NoiseLayer';

interface VisualEffectsProps {
  phase: Phase;
  intensity: number; // 0-1
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ phase, intensity }) => {
  // Полностью убраны все glitch эффекты
  // Разрешено только subtle grain после 0.7s (фазы OFF и EXPLAIN)
  // Никаких glitch эффектов для фазы HOOK (0-0.7s)
  
  return (
    <>
      {/* Subtle grain только для фаз OFF и EXPLAIN (после 0.7s) */}
      {(phase === "OFF" || phase === "EXPLAIN") && (
        <NoiseLayer intensity={intensity * 0.2} opacity={0.15} />
      )}
    </>
  );
};

export default VisualEffects;

