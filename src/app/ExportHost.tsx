/**
 * ExportHost - компонент для режима экспорта видео.
 * 
 * Архитектура вариант C:
 * - Создаёт и владеет своим CanvasRenderer
 * - Создаёт RendererPipeline для компиляции и рендеринга
 * - Создаёт TimelineEngine с FixedStepTimeSource для детерминированного рендеринга
 * - Публикует window.__EXPORT__ API для управления экспортом
 * - Уничтожает всё при размонтировании
 */

import { useRef, useEffect, useState } from 'react';
import { CanvasRenderer, type RendererConfig } from '../renderer/CanvasRenderer';
import { RendererPipeline, type FrameState } from '../renderer/RendererPipeline';
import { TimelineEngine } from '../engine/timelineEngine';
import type { ITimeSource } from '../engine/ITimeSource';
import { FixedStepTimeSource } from '../engine/fixedStepTimeSource';
import { EventBus } from '../engine/eventBus';
import type { Program } from '../programs';
import { Viewport } from '../renderer/viewport';
import { computeLayout } from '../renderer/layout/layout';
import * as PIXI from 'pixi.js';
import { ExportProgram } from '../programs';
import type { TimelineState } from '../engine/timelineSpec';

/**
 * Интерфейс для window.__EXPORT__ API
 */
export interface ExportAPI {
  ready: boolean;
  seek(ms: number): void;
  getState(): TimelineState;
  done: Promise<void>;
}

/**
 * Параметры экспорта из query string
 */
interface ExportParams {
  w?: number;
  h?: number;
  fps?: number;
  duration?: number;
  scene?: string;
  preset?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * Парсит query параметры из URL
 */
function parseExportParams(): ExportParams {
  const params = new URLSearchParams(window.location.search);
  return {
    w: params.has('w') ? parseInt(params.get('w')!, 10) : undefined,
    h: params.has('h') ? parseInt(params.get('h')!, 10) : undefined,
    fps: params.has('fps') ? parseInt(params.get('fps')!, 10) : undefined,
    duration: params.has('duration') ? parseInt(params.get('duration')!, 10) : undefined,
    scene: params.get('scene') || undefined,
    preset: (params.get('preset') as ExportParams['preset']) || undefined,
  };
}

export function ExportHost() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const pipelineRef = useRef<RendererPipeline | null>(null);
  const engineRef = useRef<TimelineEngine | null>(null);
  const timeSourceRef = useRef<ITimeSource | null>(null);
  const eventBusRef = useRef<EventBus | null>(null);
  const programRef = useRef<Program | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [program, setProgram] = useState<ExportProgram | null>(null);
  const donePromiseRef = useRef<{ resolve: () => void; promise: Promise<void> } | null>(null);

  // Парсим параметры экспорта
  const params = parseExportParams();
  const width = params.w || 1920;
  const height = params.h || 1080;
  const fps = params.fps || 30;
  const quality = params.preset || 'high';

  // Создаём программу
  useEffect(() => {
    let mounted = true;

    ExportProgram.create()
      .then((createdProgram) => {
        if (!mounted) return;
        setProgram(createdProgram);
        programRef.current = createdProgram;
      })
      .catch((error) => {
        console.error('[ExportHost] Failed to create program:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Создаём Promise для done
  useEffect(() => {
    let doneResolve: (() => void) | null = null;
    const donePromise = new Promise<void>((resolve) => {
      doneResolve = resolve;
    });
    donePromiseRef.current = { resolve: doneResolve, promise: donePromise };

    return () => {
      donePromiseRef.current = null;
    };
  }, []);

  // Инициализация renderer и pipeline
  useEffect(() => {
    if (!containerRef.current || !program) return;

    let mounted = true;

    const initialize = async () => {
      try {
        const container = containerRef.current!;

        // 1. Создаём CanvasRenderer
        const rendererConfig: RendererConfig = {
          container,
          width,
          height,
          backgroundColor: 0x0b1120,
          antialias: true,
          quality,
        };

        const renderer = new CanvasRenderer(rendererConfig);
        await renderer.init(rendererConfig);
        rendererRef.current = renderer;

        if (!mounted) {
          renderer.destroy();
          return;
        }

        // 2. Создаём EventBus
        const eventBus = new EventBus();
        eventBusRef.current = eventBus;

        // 3. Создаём FixedStepTimeSource для детерминированного рендеринга
        const duration = program.getDuration();
        const fixedStep = new FixedStepTimeSource(fps, duration);
        fixedStep.start();
        timeSourceRef.current = fixedStep;

        // 4. Создаём TimelineEngine
        const spec = program.getSpec();
        if (!spec) {
          throw new Error('Program spec is null');
        }

        const engine = new TimelineEngine(fixedStep, eventBus, spec);
        engineRef.current = engine;

        // 5. Создаём RendererPipeline
        const app = renderer.getApplication();
        if (!app || !app.stage) {
          throw new Error('Renderer app or stage is not available');
        }

        const viewport = renderer.getViewport();
        const rootContainer = new PIXI.Container();
        app.stage.addChild(rootContainer);

        const computeLayoutFn = () => {
          return computeLayout(viewport, 'default', 'fit');
        };

        const pipeline = new RendererPipeline(rootContainer, viewport, computeLayoutFn);
        pipeline.compile(program);
        pipelineRef.current = pipeline;

        setIsReady(true);
        console.log('[ExportHost] Initialized:', { quality, width, height, fps, duration });
      } catch (error) {
        console.error('[ExportHost] Initialization error:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
        pipelineRef.current = null;
      }
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      if (timeSourceRef.current && timeSourceRef.current instanceof FixedStepTimeSource) {
        timeSourceRef.current.stop();
      }
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      setIsReady(false);
    };
  }, [program, quality, width, height, fps]);

  // Render loop
  useEffect(() => {
    if (!isReady || !rendererRef.current || !pipelineRef.current || !engineRef.current || !program) {
      return;
    }

    const renderer = rendererRef.current;
    const pipeline = pipelineRef.current;
    const engine = engineRef.current;

    const tick = () => {
      if (!isRunningRef.current) return;

      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Получаем текущее время от timeSource
      const timeSource = timeSourceRef.current;
      if (!timeSource) return;

      // Для FixedStepTimeSource обновляем время на следующий шаг
      if (timeSource instanceof FixedStepTimeSource) {
        const hasNext = timeSource.next();
        if (!hasNext || timeSource.isFinished()) {
          // Экспорт завершён
          isRunningRef.current = false;
          if (donePromiseRef.current) {
            donePromiseRef.current.resolve();
          }
          return;
        }
      }

      const currentTime = timeSource.getElapsed();

      // Получаем активную сцену от программы
      const sceneState = program.getSceneAt(currentTime);

      // Получаем состояние timeline от engine
      const timelineState = engine.getCurrentState();

      // Обновляем sceneState с timelineState
      if (sceneState) {
        sceneState.timelineState = timelineState;
      }

      // Рендерим кадр
      const frameState: FrameState = {
        sceneState,
        dt,
      };

      pipeline.render(frameState);

      // Явно рендерим кадр
      const app = renderer.getApplication();
      if (app && app.renderer) {
        app.renderer.render(app.stage);
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    // Запускаем render loop
    isRunningRef.current = true;
    lastTimeRef.current = performance.now();
    engine.start();
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      isRunningRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (engine) {
        engine.stop();
      }
    };
  }, [isReady, program]);

  // Публикуем window.__EXPORT__ API
  useEffect(() => {
    if (!isReady || !donePromiseRef.current) return;

    const exportAPI: ExportAPI = {
      ready: isReady,
      seek: (ms: number) => {
        const timeSource = timeSourceRef.current;
        if (timeSource) {
          if ('setTime' in timeSource && typeof timeSource.setTime === 'function') {
            (timeSource as any).setTime(ms);
          } else {
            timeSource.setForcedTime(ms);
          }
        }
        if (engineRef.current) {
          engineRef.current.seekTo(ms);
        }
      },
      getState: () => {
        if (!engineRef.current) {
          throw new Error('Engine not initialized');
        }
        return engineRef.current.getCurrentState();
      },
      done: donePromiseRef.current.promise,
    };

    (window as any).__EXPORT__ = exportAPI;

    return () => {
      delete (window as any).__EXPORT__;
    };
  }, [isReady]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0b1120]"
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}

