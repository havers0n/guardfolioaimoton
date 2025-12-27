/**
 * SceneRoot - корневой компонент сцены.
 * Максимально простой компонент без логики.
 */

import { useRef } from 'react';
import { useTimelineEngine } from '../hooks/useTimelineEngine';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';

export function SceneRoot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { engine, eventBus } = useTimelineEngine();
  useCanvasRenderer(containerRef, engine, eventBus);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden relative"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}

