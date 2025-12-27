/**
 * useCanvasRenderer - React hook для управления canvas renderer.
 * Использует singleton для защиты от StrictMode re-render.
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
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Инициализация renderer через singleton (защита от StrictMode)
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    // Получаем или создаём renderer через singleton
    (async () => {
      try {
        const renderer = await getRenderer({
          container: containerRef.current!,
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0x0b1120,
          antialias: true,
        });

        // Проверяем, не был ли компонент размонтирован
        if (cancelled) {
          return;
        }

        rendererRef.current = renderer;
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing CanvasRenderer:', error);
        if (!cancelled) {
          setIsReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      // НЕ вызываем destroy здесь - singleton управляет жизненным циклом
      // destroy будет вызван только при закрытии приложения
    };
  }, [containerRef]); // Только containerRef в deps

  // Подключение engine к renderer (отдельный эффект)
  useEffect(() => {
    // Получаем renderer из singleton (может быть уже готов)
    const renderer = rendererRef.current || getRendererSync();
    
    if (!renderer || !isReady || !engine || !eventBus) {
      return;
    }

    // Подключаем engine к renderer
    console.log('Connecting engine to renderer');
    renderer.connectEngine(engine, eventBus);
  }, [isReady, engine, eventBus]);

  return { rendererRef, isReady };
}

