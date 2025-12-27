import React, { useEffect, useState } from 'react';
import { BRAND, TAGLINE } from '../src/constants';

interface LogoFinalProps {
  isVisible: boolean;
}

const LogoFinal: React.FC<LogoFinalProps> = ({ isVisible }) => {
  const [animationState, setAnimationState] = useState<'hidden' | 'entering' | 'visible'>('hidden');

  useEffect(() => {
    if (isVisible) {
      setAnimationState('entering');
      const timer = setTimeout(() => setAnimationState('visible'), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationState('hidden');
    }
  }, [isVisible]);

  if (!isVisible && animationState === 'hidden') return null;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0b1120]"
      style={{
        zIndex: 70,
        opacity: animationState === 'hidden' ? 0 : animationState === 'entering' ? 0 : 1,
        transition: 'opacity 1s ease-in-out',
      }}
    >
      {/* Логотип Guardfolio AI */}
      <div
        className="text-center mb-6"
        style={{
          transform: animationState === 'entering' ? 'scale(0.9) translateY(20px)' : 'scale(1) translateY(0)',
          opacity: animationState === 'entering' ? 0 : 1,
          transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
            opacity: animationState === 'entering' ? 0 : 0.9,
            transition: 'opacity 1s ease-in-out 0.3s',
          }}
        >
          {TAGLINE}
        </p>
      </div>

      {/* Декоративные элементы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          style={{
            opacity: animationState === 'visible' ? 0.6 : 0,
            transition: 'opacity 2s ease-in-out',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl"
          style={{
            opacity: animationState === 'visible' ? 0.5 : 0,
            transition: 'opacity 2s ease-in-out 0.2s',
          }}
        />
      </div>
    </div>
  );
};

export default LogoFinal;

