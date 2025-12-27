/**
 * useCanvasRenderer - минимальный bootstrap для renderer.
 * Только создаёт renderer, не управляет жизненным циклом.
 */

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getRenderer, getRendererSync } from '../renderer/rendererSingleton';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { TimelineEngine } from '../engine/timelineEngine';
import { EventBus } from '../engine/eventBus';

export function useCanvasRenderer(
  containerRef: RefObject<HTMLElement>,
  engine: TimelineEngine | null,
  eventBus: EventBus | null
) {
  const [isReady, setIsReady] = useState(false);

  // Bootstrap: создаём renderer один раз
  useEffect(() => {
    if (!containerRef.current) return;

    getRenderer({
      container: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0b1120,
      antialias: true,
    }).then(() => {
      setIsReady(true);
    }).catch((error) => {
      console.error('Error initializing CanvasRenderer:', error);
    });
  }, []); // Пустой deps - запускается один раз

  // Подключение engine к renderer
  useEffect(() => {
    const renderer = getRendererSync();
    if (!renderer || !isReady || !engine || !eventBus) {
      return;
    }

    renderer.connectEngine(engine, eventBus);
  }, [isReady, engine, eventBus]);

  return { isReady };
}

