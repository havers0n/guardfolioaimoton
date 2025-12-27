/**
 * useCanvasRenderer - React hook для управления canvas renderer.
 * Создает и управляет жизненным циклом CanvasRenderer.
 */

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { CanvasRenderer } from '../src/renderer/CanvasRenderer';
import { TimelineEngine } from '../src/engine/timelineEngine';
import { EventBus } from '../src/engine/eventBus';

export function useCanvasRenderer(
  containerRef: RefObject<HTMLElement>,
  engine: TimelineEngine | null,
  eventBus: EventBus | null
) {
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Инициализация renderer (не зависит от engine/eventBus)
  useEffect(() => {
    if (!containerRef.current) return;

    // Guard: если renderer уже создан, не создаём новый (StrictMode safe)
    if (rendererRef.current) {
      console.log('Renderer already exists, skipping creation');
      return;
    }

    let cancelled = false;
    const renderer = new CanvasRenderer({
      container: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0b1120,
      antialias: true,
    });

    rendererRef.current = renderer;

    // Асинхронная инициализация PixiJS v8
    (async () => {
      try {
        await renderer.init({
          container: containerRef.current!,
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0x0b1120,
          antialias: true,
        });

        // Проверяем, не был ли компонент размонтирован во время инициализации
        if (cancelled) {
          renderer.destroy();
          return;
        }

        // Запускаем render loop только после успешной инициализации
        // Renderer будет работать даже без engine (с пустым состоянием)
        renderer.start();

        // Устанавливаем флаг готовности только после успешного init()
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing CanvasRenderer:', error);
        // Очищаем при ошибке инициализации
        if (!cancelled) {
          renderer.destroy();
          rendererRef.current = null;
        }
        setIsReady(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsReady(false);
      // Безопасный cleanup: destroy идемпотентен
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [containerRef]); // Только containerRef в deps - стабильная ссылка

  // Подключение engine к renderer (отдельный эффект)
  useEffect(() => {
    if (!rendererRef.current || !isReady || !engine || !eventBus) {
      if (rendererRef.current && isReady && (!engine || !eventBus)) {
        console.warn('Renderer ready but engine/eventBus not available yet');
      }
      return;
    }

    // Подключаем engine к renderer
    console.log('Connecting engine to renderer');
    rendererRef.current.connectEngine(engine, eventBus);
  }, [isReady, engine, eventBus]);

  return { rendererRef, isReady };
}

