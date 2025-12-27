import React from 'react';
import { BRAND, TAGLINE } from '../src/constants';

interface LogoFinalProps {
  progress: number; // 0 to 1
}

const LogoFinal: React.FC<LogoFinalProps> = ({ progress }) => {
  if (progress <= 0) return null;

  // Easing function
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const clamp = (val: number) => Math.max(0, Math.min(1, val));

  const p = clamp(progress);
  const easedP = easeOut(p);

  // Growth Animation: Start from scale 0.5 (center of implosion)
  const scale = 0.5 + 0.5 * easedP; // 0.5 -> 1.0
  const opacity = p; // 0 -> 1

  const taglineP = clamp((progress - 0.3) / 0.7);
  const taglineOpacity = easeOut(taglineP) * 0.9; 

  const blob1Opacity = Math.min(0.6, p * 0.6);
  const blob2Opacity = Math.min(0.5, Math.max(0, p - 0.2) * 0.5);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1120]"
      style={{
        zIndex: 70,
        opacity: opacity,
        // No CSS transitions to allow precise Seek Mode
      }}
    >
      <div
        className="text-center mb-6"
        style={{
          transform: `scale(${scale})`, // Just scale, no translateY
          opacity: 1,
        }}
      >
        <h1
          className="text-5xl sm:text-7xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.02em',
          }}
        >
          {BRAND}
        </h1>
        <p
          className="text-xl sm:text-2xl text-slate-400 font-light tracking-wide"
          style={{
            opacity: taglineOpacity,
          }}
        >
          {TAGLINE}
        </p>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          style={{
            opacity: blob1Opacity,
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl"
          style={{
            opacity: blob2Opacity,
          }}
        />
      </div>
    </div>
  );
};

export default LogoFinal;
