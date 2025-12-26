import React, { useState, useEffect } from 'react';
import { NarrativePhase } from './types';
import NarrativeTimeline from './components/NarrativeTimeline';
import VisualEffects from './components/VisualEffects';
import NarrativeOverlay from './components/NarrativeOverlay';
import DistortedInterface from './components/DistortedInterface';
import LogoFinal from './components/LogoFinal';
import InterfaceContent from './components/InterfaceContent';
import RotatingHeader from './components/RotatingHeader';

const App: React.FC = () => {
  const [currentRealTimeMsg, setCurrentRealTimeMsg] = useState(0);

  // Real-time message rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRealTimeMsg(prev => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <NarrativeTimeline>
      {(state) => {
        // Интерфейс виден во всех фазах, но с разными эффектами
        // В первых фазах он сильно искажен, в последних - четкий
        const showLogo = state.phase === NarrativePhase.CLARITY && state.elapsed >= 25 * 1000;
        const showInterfaceContent = state.phase === NarrativePhase.REVELATION || 
                                    state.phase === NarrativePhase.CLARITY;

        return (
          <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden relative">
            {/* Визуальные эффекты (шум, glitch, разрывы) */}
            <VisualEffects phase={state.phase} intensity={state.intensity} />

            {/* Нарративные текстовые наложения */}
            <NarrativeOverlay phase={state.phase} elapsed={state.elapsed} />

            {/* Финальный экран с логотипом */}
            {showLogo && (
              <LogoFinal isVisible={true} />
            )}

            {/* Основной интерфейс с примененными эффектами */}
            {/* В первых фазах показываем только искаженный интерфейс без контента */}
            {!showInterfaceContent && (
              <DistortedInterface phase={state.phase} intensity={state.intensity}>
                <div className="w-full max-w-2xl opacity-30">
                  <RotatingHeader />
                </div>
              </DistortedInterface>
            )}

            {/* В фазах REVELATION и CLARITY показываем полный интерфейс */}
            {showInterfaceContent && (
              <DistortedInterface phase={state.phase} intensity={state.intensity}>
                <InterfaceContent
                  phase={state.phase}
                  elapsed={state.elapsed}
                  currentRealTimeMsg={currentRealTimeMsg}
                  onProgressUpdate={() => {}}
                />
              </DistortedInterface>
            )}

            {/* Subtle background glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          </div>
        );
      }}
    </NarrativeTimeline>
  );
};

export default App;
