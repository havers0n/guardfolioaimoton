import React, { useState, useEffect, useRef } from 'react';
import { DURATION_MS } from './src/constants';
import NarrativeTimeline from './components/NarrativeTimeline';
import VisualEffects from './components/VisualEffects';
import NarrativeOverlay from './components/NarrativeOverlay';
import DistortedInterface from './components/DistortedInterface';
import LogoFinal from './components/LogoFinal';
import InterfaceContent from './components/InterfaceContent';
import RotatingHeader from './components/RotatingHeader';
import VideoRecorder from './components/VideoRecorder';
import { useCleanRecordingMode } from './hooks/useCleanRecordingMode';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Включаем "чистый" режим записи
  useCleanRecordingMode(isRecording);

  // Автозапуск записи при монтировании и установка времени старта для скриншотов
  useEffect(() => {
    // Устанавливаем время старта для синхронизации скриншотов Playwright
    // Используем performance.now() для более точной синхронизации
    (window as any).__START_TIME__ = performance.now();
    
    // Небольшая задержка для полной загрузки
    const timer = setTimeout(() => {
      setIsRecording(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NarrativeTimeline>
      {(state) => {
        // Интерфейс виден во всех фазах, но с разными эффектами
        // В первых фазах он сильно искажен, в последних - четкий
        // Показываем логотип начиная с 27 секунды, чтобы он был виден дольше в ярком состоянии
        const showLogo = state.phase === "CLARITY" && state.elapsed >= 27_000;
        const showInterfaceContent = state.phase === "SEE" || 
                                    (state.phase === "CLARITY" && state.elapsed < 27_000);

        return (
          <div 
            ref={containerRef}
            className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden relative"
            data-recording-container
          >
            {/* Компонент записи видео */}
            {containerRef.current && (
              <VideoRecorder 
                containerRef={containerRef} 
                isRecording={isRecording}
                onRecordingComplete={(blob) => {
                  console.log('Recording completed. File size:', blob.size, 'bytes');
                  setIsRecording(false);
                }}
              />
            )}
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
                  currentRealTimeMsg={0}
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
