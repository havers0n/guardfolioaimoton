/**
 * SceneInspector - инструмент для отладки и инспекции сцены (новая архитектура).
 * Работает напрямую с RendererPipeline и TimelineEngine, без GuardfolioScene.
 * 
 * Позволяет:
 * - Видеть список элементов
 * - Включать/выключать элементы
 * - Видеть bounding boxes / anchors / safe-area
 * - Перематывать время по фазам
 */

import { useState, useEffect, useRef } from 'react';
import { RendererPipeline } from '../renderer/RendererPipeline';
import { TimelineEngine } from '../engine/timelineEngine';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import type { Program } from '../programs';
import { SHOTS, getActiveShot, type SceneShot } from '../scenes/guardfolio/shots';
import * as PIXI from 'pixi.js';

interface ElementInfo {
  index: number;
  type: string;
  visible: boolean;
  bounds: { x: number; y: number; width: number; height: number } | null;
}

interface PhaseInfo {
  phase: string;
  fromMs: number;
  toMs: number;
}

export interface SceneInspectorProps {
  renderer: CanvasRenderer;
  pipeline: RendererPipeline;
  engine: TimelineEngine;
  program: Program;
}

export function SceneInspectorNew({ renderer, pipeline, engine, program }: SceneInspectorProps) {
  const [elements, setElements] = useState<ElementInfo[]>([]);
  const [phases, setPhases] = useState<PhaseInfo[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeShot, setActiveShot] = useState<SceneShot | null>(null);
  const [shotsEnabled, setShotsEnabled] = useState(true);
  const [showBounds, setShowBounds] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showAnchors, setShowAnchors] = useState(false);
  const [debugOverlay, setDebugOverlay] = useState<PIXI.Graphics | null>(null);
  const debugOverlayRef = useRef<PIXI.Graphics | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Получаем элементы из pipeline
    const elementList = pipeline.getElements();
    const elementInfos: ElementInfo[] = elementList.map((item, index) => ({
      index,
      type: item.type,
      visible: pipeline.getElementVisible(index),
      bounds: pipeline.getElementBounds(index),
    }));
    setElements(elementInfos);

    // Получаем фазы из spec
    const spec = program.getSpec();
    if (spec) {
      const phaseList: PhaseInfo[] = spec.phases.map(p => ({
        phase: p.phase,
        fromMs: p.fromMs,
        toMs: p.toMs,
      }));
      setPhases(phaseList);
    }

    // Функция для маппинга типов элементов из shots в типы элементов renderer
    const mapShotElementTypeToRendererType = (shotType: keyof SceneShot['visible']): string | null => {
      switch (shotType) {
        case 'header':
          return 'overlaytext';
        case 'chart':
          return 'chart';
        case 'logo':
          return 'logo';
        case 'background':
          return 'background';
        case 'tasks':
          return null;
        default:
          return null;
      }
    };

    // Функция для применения видимости элементов на основе активного шота
    const applyShotVisibility = (shot: SceneShot | null, elementList: Array<{ element: any; container: PIXI.Container; type: string }>, enabled: boolean) => {
      if (!enabled) return;

      if (!shot) {
        elementList.forEach((item, index) => {
          if (item.type !== 'background') {
            pipeline.setElementVisible(index, false);
          }
        });
        return;
      }

      Object.entries(shot.visible).forEach(([shotElementType, shouldBeVisible]) => {
        const rendererType = mapShotElementTypeToRendererType(shotElementType as keyof SceneShot['visible']);
        if (!rendererType) return;

        const elementIndex = elementList.findIndex(item => item.type === rendererType);
        if (elementIndex >= 0) {
          const currentVisible = pipeline.getElementVisible(elementIndex);
          if (currentVisible !== shouldBeVisible) {
            pipeline.setElementVisible(elementIndex, shouldBeVisible ?? false);
          }
        }
      });
    };

    // Применяем начальную видимость
    const initialState = engine.getCurrentState();
    const initialShot = getActiveShot(initialState.elapsed);
    setActiveShot(initialShot);
    applyShotVisibility(initialShot, elementList, shotsEnabled);

    // Создаем debug overlay
    const app = renderer.getApplication();
    if (app && app.stage) {
      const rootContainer = pipeline.getRootContainer();
      const overlay = new PIXI.Graphics();
      overlay.zIndex = 10000;
      rootContainer.addChild(overlay);
      debugOverlayRef.current = overlay;
      setDebugOverlay(overlay);
    }

    // Обновляем состояние каждые 100ms
    const updateInterval = setInterval(() => {
      const state = engine.getCurrentState();
      const time = state.elapsed;
      setCurrentTime(time);

      const currentShot = getActiveShot(time);
      setActiveShot(currentShot);

      const currentElementList = pipeline.getElements();
      applyShotVisibility(currentShot, currentElementList, shotsEnabled);

      const updatedElements = currentElementList.map((item, index) => ({
        index,
        type: item.type,
        visible: pipeline.getElementVisible(index),
        bounds: pipeline.getElementBounds(index),
      }));
      setElements(updatedElements);
    }, 100);

    // Функция отрисовки debug overlay
    const drawDebugOverlay = () => {
      if (!debugOverlayRef.current || !app) return;

      const overlay = debugOverlayRef.current;
      overlay.clear();

      if (!showBounds && !showSafeArea && !showGrid && !showAnchors) {
        animationFrameRef.current = requestAnimationFrame(drawDebugOverlay);
        return;
      }

      const viewport = pipeline.getViewport();
      const width = viewport.getWidth();
      const height = viewport.getHeight();
      const layout = pipeline.getLayout();

      // Рисуем safe-area
      if (showSafeArea && layout) {
        overlay.rect(
          layout.safe.left,
          layout.safe.top,
          layout.safe.right - layout.safe.left,
          layout.safe.bottom - layout.safe.top
        );
        overlay.fill({ color: 0x00ff00, alpha: 0.05 });
        overlay.stroke({ width: 2, color: 0x00ff00, alpha: 0.3 });

        overlay.moveTo(layout.safe.left, 0);
        overlay.lineTo(layout.safe.left, height);
        overlay.moveTo(layout.safe.right, 0);
        overlay.lineTo(layout.safe.right, height);
        overlay.moveTo(0, layout.safe.top);
        overlay.lineTo(width, layout.safe.top);
        overlay.moveTo(0, layout.safe.bottom);
        overlay.lineTo(width, layout.safe.bottom);
        overlay.stroke({ width: 1, color: 0x00ff00, alpha: 0.2 });
      }

      // Рисуем grid
      if (showGrid && layout) {
        const grid = layout.grid;
        overlay.stroke({ width: 1, color: 0x3b82f6, alpha: 0.1 });
        
        for (let x = layout.safe.left; x <= layout.safe.right; x += grid) {
          overlay.moveTo(x, 0);
          overlay.lineTo(x, height);
        }
        
        for (let y = layout.safe.top; y <= layout.safe.bottom; y += grid) {
          overlay.moveTo(0, y);
          overlay.lineTo(width, y);
        }
      }

      // Рисуем anchors
      if (showAnchors && layout) {
        const anchorSize = 8;
        const anchorColor = 0x10b981;
        
        overlay.circle(layout.centerX, layout.centerY, anchorSize);
        overlay.fill({ color: anchorColor, alpha: 0.8 });
        overlay.stroke({ width: 2, color: anchorColor, alpha: 1 });
        
        overlay.circle(layout.leftColX, layout.centerY, anchorSize * 0.7);
        overlay.fill({ color: 0x3b82f6, alpha: 0.8 });
        
        overlay.circle(layout.centerColX, layout.centerY, anchorSize * 0.7);
        overlay.fill({ color: 0x8b5cf6, alpha: 0.8 });
        
        overlay.circle(layout.rightColX, layout.centerY, anchorSize * 0.7);
        overlay.fill({ color: 0xef4444, alpha: 0.8 });
        
        overlay.circle(layout.safe.left, layout.safe.top, anchorSize * 0.5);
        overlay.fill({ color: 0x00ff00, alpha: 0.6 });
        overlay.circle(layout.safe.right, layout.safe.top, anchorSize * 0.5);
        overlay.fill({ color: 0x00ff00, alpha: 0.6 });
        overlay.circle(layout.safe.left, layout.safe.bottom, anchorSize * 0.5);
        overlay.fill({ color: 0x00ff00, alpha: 0.6 });
        overlay.circle(layout.safe.right, layout.safe.bottom, anchorSize * 0.5);
        overlay.fill({ color: 0x00ff00, alpha: 0.6 });
      }

      // Рисуем bounding boxes
      if (showBounds) {
        const elementList = pipeline.getElements();
        elementList.forEach((item, index) => {
          const bounds = pipeline.getElementBounds(index);
          if (!bounds || bounds.width === 0 || bounds.height === 0) return;

          const visible = pipeline.getElementVisible(index);
          const color = visible ? 0x3b82f6 : 0x666666;

          overlay.rect(bounds.x, bounds.y, bounds.width, bounds.height);
          overlay.stroke({ width: 2, color, alpha: 0.6 });

          overlay.circle(bounds.x, bounds.y, 4);
          overlay.fill({ color, alpha: 0.8 });
        });
      }

      if (app.renderer) {
        app.renderer.render(app.stage);
      }

      animationFrameRef.current = requestAnimationFrame(drawDebugOverlay);
    };

    drawDebugOverlay();

    return () => {
      clearInterval(updateInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (debugOverlayRef.current && app && app.stage) {
        const rootContainer = pipeline.getRootContainer();
        rootContainer.removeChild(debugOverlayRef.current);
        debugOverlayRef.current.destroy();
        debugOverlayRef.current = null;
      }
    };
  }, [renderer, pipeline, engine, program, showBounds, showSafeArea, showGrid, showAnchors, shotsEnabled]);

  const toggleElementVisibility = (index: number) => {
    const currentVisible = pipeline.getElementVisible(index);
    pipeline.setElementVisible(index, !currentVisible);

    setElements(prev =>
      prev.map((el, i) =>
        i === index ? { ...el, visible: !currentVisible } : el
      )
    );
  };

  const seekToPhase = (phase: PhaseInfo) => {
    engine.seekTo(phase.fromMs);
  };

  const seekToTime = (timeMs: number) => {
    engine.seekTo(timeMs);
  };

  const seekToShot = (shot: SceneShot) => {
    engine.seekTo(shot.from);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const duration = program.getDuration();

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none z-50">
      <div className="absolute top-4 left-4 w-80 bg-black/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4 text-white text-sm pointer-events-auto max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 text-blue-400">Scene Inspector</h2>

        <div className="mb-4 pb-4 border-b border-gray-700">
          <div className="mb-2">
            <label className="block text-xs text-gray-400 mb-1">Current Time</label>
            <div className="text-lg font-mono">{formatTime(currentTime)}</div>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 25000}
            value={currentTime}
            onChange={(e) => seekToTime(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4 pb-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-gray-400">Shots (Composition)</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={shotsEnabled}
                onChange={(e) => setShotsEnabled(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-gray-400">Auto</span>
            </label>
          </div>
          <div className="space-y-1">
            {SHOTS.map((shot) => {
              const isActive = activeShot?.id === shot.id;
              return (
                <button
                  key={shot.id}
                  onClick={() => seekToShot(shot)}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600/30 border border-blue-500'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold capitalize">{shot.id}</div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatTime(shot.from)} - {formatTime(shot.to)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Object.entries(shot.visible)
                      .filter(([_, visible]) => visible)
                      .map(([type]) => type)
                      .join(', ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 pb-4 border-b border-gray-700">
          <label className="block text-xs text-gray-400 mb-2">Phases</label>
          <div className="space-y-1">
            {phases.map((phase, idx) => (
              <button
                key={idx}
                onClick={() => seekToPhase(phase)}
                className="w-full text-left px-2 py-1 rounded hover:bg-gray-800 text-xs"
              >
                <div className="font-semibold">{phase.phase}</div>
                <div className="text-gray-500">{formatTime(phase.fromMs)} - {formatTime(phase.toMs)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 pb-4 border-b border-gray-700">
          <label className="block text-xs text-gray-400 mb-2">Debug Overlay</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBounds}
                onChange={(e) => setShowBounds(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Show Bounding Boxes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSafeArea}
                onChange={(e) => setShowSafeArea(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Show Safe Area</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Show Grid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnchors}
                onChange={(e) => setShowAnchors(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Show Anchors</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Elements</label>
          <div className="space-y-1">
            {elements.map((element) => (
              <div
                key={element.index}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-800"
              >
                <div className="flex-1">
                  <div className="font-semibold capitalize">{element.type}</div>
                  {element.bounds && (
                    <div className="text-xs text-gray-500">
                      {Math.round(element.bounds.x)}, {Math.round(element.bounds.y)} |{' '}
                      {Math.round(element.bounds.width)}×{Math.round(element.bounds.height)}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={element.visible}
                    onChange={() => toggleElementVisibility(element.index)}
                    className="w-4 h-4"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

