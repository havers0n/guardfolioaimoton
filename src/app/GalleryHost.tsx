/**
 * GalleryHost - компонент для режима gallery (Scene Inspector).
 * 
 * Архитектура вариант C:
 * - Создаёт и владеет своим CanvasRenderer
 * - Создаёт RendererPipeline для компиляции и рендеринга
 * - Создаёт TimelineEngine для управления временем
 * - Уничтожает всё при размонтировании
 */

import { useRef, useEffect, useState } from 'react';
import { CanvasRenderer, type RendererConfig } from '../renderer/CanvasRenderer';
import { RendererPipeline, type FrameState } from '../renderer/RendererPipeline';
import { TimelineEngine } from '../engine/timelineEngine';
import type { ITimeSource } from '../engine/ITimeSource';
import { TimeSource } from '../engine/timeSource';
import { EventBus } from '../engine/eventBus';
import type { Program } from '../programs';
import { Viewport } from '../renderer/viewport';
import { computeLayout } from '../renderer/layout/layout';
import * as PIXI from 'pixi.js';
import { GalleryProgram } from '../programs';
import { SceneInspectorNew } from './SceneInspectorNew';

export interface GalleryHostConfig {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  width?: number;
  height?: number;
}

export function GalleryHost({ quality = 'high', width = 1920, height = 1080 }: GalleryHostConfig = {}) {
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
  const [program, setProgram] = useState<GalleryProgram | null>(null);

  // Создаём программу
  useEffect(() => {
    let mounted = true;

    GalleryProgram.create()
      .then((createdProgram) => {
        if (!mounted) return;
        setProgram(createdProgram);
        programRef.current = createdProgram;
      })
      .catch((error) => {
        console.error('[GalleryHost] Failed to create program:', error);
      });

    return () => {
      mounted = false;
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

        // 3. Создаём TimeSource (real-time для gallery)
        const timeSource = new TimeSource();
        timeSource.initialize();
        timeSourceRef.current = timeSource;

        // 4. Создаём TimelineEngine
        const spec = program.getSpec();
        if (!spec) {
          throw new Error('Program spec is null');
        }

        const engine = new TimelineEngine(timeSource, eventBus, spec);
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
        console.log('[GalleryHost] Initialized:', { quality, duration: program.getDuration() });
      } catch (error) {
        console.error('[GalleryHost] Initialization error:', error);
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
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      setIsReady(false);
    };
  }, [program, quality, width, height]);

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

  return (
    <>
      <div
        ref={containerRef}
        className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden relative"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      />
      {isReady && rendererRef.current && pipelineRef.current && engineRef.current && program && (
        <SceneInspectorNew
          renderer={rendererRef.current}
          pipeline={pipelineRef.current}
          engine={engineRef.current}
          program={program}
        />
      )}
    </>
  );
}

