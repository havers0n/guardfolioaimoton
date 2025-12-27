/**
 * RendererPipeline V1 - пайплайн рендеринга согласно API v1.
 * 
 * Ответственность:
 * - владеет TimelineEngine для каждой сцены
 * - вычисляет timelineState внутри себя
 * - управляет lifecycle элементов
 * - обеспечивает корректное переключение сцен
 * 
 * Входные данные на кадр:
 * - programTimeMs (время от начала Program)
 * - dtMs (дельта времени кадра)
 * 
 * Pipeline сам:
 * - определяет активную сцену через program.getSceneAt(programTimeMs)
 * - вычисляет sceneTimeMs
 * - вычисляет timelineState = engine.getStateAt(sceneTimeMs)
 */

import type { Program, SceneRef, Scene } from '../programs/api-v1';
import type { ElementConfig } from '../elements/registry';
import type { Element } from '../elements/Element';
import { createElements, mountElements } from '../elements/elementFactory';
import type { Viewport } from './viewport';
import type { Layout } from './layout/layout';
import { getContainerContext, setContainerContext, updateContainerLayout } from './containerContext';
import type { ElementContext } from '../elements/Element';
import type { TimelineState } from '../engine/timelineSpec';
import { TimelineEngine } from '../engine/timelineEngine';
import { EventBus } from '../engine/eventBus';
import { TimeSource } from '../engine/timeSource';
import * as PIXI from 'pixi.js';

/**
 * CompiledScene - скомпилированная сцена с элементами и TimelineEngine.
 */
export interface CompiledScene {
  sceneId: string;
  scene: Scene;
  elements: Array<{ element: Element; container: PIXI.Container; sceneContainer: PIXI.Container }>;
  engine: TimelineEngine;
}

/**
 * PipelineInspectInfo - информация для инспекции.
 */
export interface PipelineInspectInfo {
  /** Список всех элементов с их типами */
  elements: Array<{
    sceneId: string;
    element: Element;
    container: PIXI.Container;
    type: string;
    visible: boolean;
  }>;
  /** Текущая активная сцена */
  activeSceneId: string | null;
  /** Viewport */
  viewport: Viewport;
  /** Текущий layout */
  layout: Layout;
}

/**
 * RendererPipelineV1 - пайплайн рендеринга API v1.
 * 
 * Pipeline владеет TimelineEngine и вычисляет timelineState внутри себя.
 */
export class RendererPipelineV1 {
  private compiledScenes: Map<string, CompiledScene> = new Map();
  private currentSceneId: string | null = null;
  private currentSceneRef: SceneRef | null = null;
  private rootContainer: PIXI.Container;
  private viewport: Viewport;
  private computeLayout: () => Layout;
  private program: Program | null = null;

  constructor(
    rootContainer: PIXI.Container,
    viewport: Viewport,
    computeLayout: () => Layout
  ) {
    this.rootContainer = rootContainer;
    this.viewport = viewport;
    this.computeLayout = computeLayout;
  }

  /**
   * Компилирует программу в скомпилированные сцены.
   * 
   * ⚠️ Важно: Создаёт все элементы для всех сцен один раз.
   * Элементы не пересоздаются при переключении сцен - только управляется видимость.
   * 
   * Валидирует:
   * - SceneRef интервалы (не пересекаются / корректно упорядочены)
   * - Scene.durationMs совпадает с endMs-startMs
   * 
   * Подготавливает:
   * - TimelineEngine для каждой сцены
   * - SceneContainer для каждой сцены
   * - Все элементы для каждой сцены (mount в sceneContainer)
   * 
   * @param program Программа для компиляции
   * @throws Error если валидация не прошла
   */
  compile(program: Program): void {
    this.program = program;
    this.compiledScenes.clear();
    this.currentSceneId = null;
    this.currentSceneRef = null;

    const sceneRefs = program.getScenes?.() || [];
    
    // Валидация: проверяем интервалы и длительности
    this.validateSceneRefs(sceneRefs);
    
    // Компилируем каждую сцену
    for (const sceneRef of sceneRefs) {
      const scene = sceneRef.getScene();
      const layout = this.computeLayout();

      // Валидация: scene.durationMs === (endMs - startMs)
      const sceneRefDurationMs = sceneRef.endMs - sceneRef.startMs;
      if (scene.durationMs !== sceneRefDurationMs) {
        throw new Error(
          `Scene ${scene.sceneId}: durationMs (${scene.durationMs}) does not match sceneRef duration (${sceneRefDurationMs})`
        );
      }

      // Создаём TimelineEngine для сцены
      // Используем dummy TimeSource и EventBus, так как нам нужен только getStateAt()
      const dummyTimeSource = new TimeSource();
      const dummyEventBus = new EventBus();
      const engine = new TimelineEngine(dummyTimeSource, dummyEventBus, scene.timelineSpec);

      // Создаём элементы
      const elementsWithZIndex = createElements(scene.elements);

      // Создаём контейнер для сцены
      const sceneContainer = new PIXI.Container();
      sceneContainer.visible = false; // По умолчанию скрыты
      this.rootContainer.addChild(sceneContainer);

      // Монтируем элементы
      const elementContainers = mountElements(
        elementsWithZIndex,
        sceneContainer,
        this.viewport,
        layout
      );

      // Сохраняем скомпилированную сцену
      const compiledScene: CompiledScene = {
        sceneId: scene.sceneId,
        scene,
        elements: elementsWithZIndex.map(({ element }) => ({
          element,
          container: elementContainers.get(element)!,
          sceneContainer,
        })),
        engine,
      };

      this.compiledScenes.set(scene.sceneId, compiledScene);
    }

    console.log('[RendererPipelineV1] Compiled program:', {
      programId: program.programId,
      scenes: this.compiledScenes.size,
      totalElements: Array.from(this.compiledScenes.values()).reduce(
        (sum, scene) => sum + scene.elements.length,
        0
      ),
    });
  }

  /**
   * Валидирует SceneRef интервалы.
   * Проверяет что интервалы не пересекаются и корректно упорядочены.
   */
  private validateSceneRefs(sceneRefs: SceneRef[]): void {
    // Проверяем что startMs < endMs для каждого SceneRef
    for (const sceneRef of sceneRefs) {
      if (sceneRef.startMs >= sceneRef.endMs) {
        throw new Error(
          `SceneRef ${sceneRef.sceneId}: startMs (${sceneRef.startMs}) must be < endMs (${sceneRef.endMs})`
        );
      }
    }

    // Проверяем что интервалы не пересекаются
    // Используем [startMs, endMs) - left-closed, right-open
    const sortedRefs = [...sceneRefs].sort((a, b) => a.startMs - b.startMs);
    
    for (let i = 0; i < sortedRefs.length - 1; i++) {
      const current = sortedRefs[i];
      const next = sortedRefs[i + 1];
      
      // Интервалы не должны пересекаться: current.endMs <= next.startMs
      if (current.endMs > next.startMs) {
        throw new Error(
          `SceneRef intervals overlap: ${current.sceneId} [${current.startMs}, ${current.endMs}) overlaps with ${next.sceneId} [${next.startMs}, ${next.endMs})`
        );
      }
    }
  }

  /**
   * Переключает активную сцену и гарантирует корректный lifecycle.
   * 
   * ⚠️ Важно: Элементы создаются в compile(), а не при переключении сцен.
   * 
   * Scene switching semantics:
   * - Если сцена НЕ сменилась (sceneId тот же): элементы не ремоунтятся, только update
   * - Если сцена сменилась:
   *   1. Скрываем элементы старой сцены: sceneContainer.visible = false
   *   2. Показываем элементы новой сцены: sceneContainer.visible = true
   *   3. Первый update новой сцены выполняется на том же кадре после переключения
   * 
   * Семантика sceneContainer:
   * - Каждая сцена имеет собственный sceneContainer (PIXI.Container)
   * - Все элементы сцены добавляются в sceneContainer при compile()
   * - При переключении сцен: активный visible = true, остальные visible = false
   * - Контейнеры не пересоздаются
   * 
   * ⚠️ Запрещено: Переинициализация элементов при смене сцен.
   * Все элементы создаются один раз в compile() и переиспользуются.
   */
  setActiveScene(sceneRef: SceneRef | null): void {
    // Если сцена не изменилась, ничего не делаем
    if (sceneRef?.sceneId === this.currentSceneId) {
      return;
    }

    // Скрываем предыдущую сцену (визуальный detach)
    if (this.currentSceneId) {
      const previousCompiledScene = this.compiledScenes.get(this.currentSceneId);
      if (previousCompiledScene && previousCompiledScene.elements.length > 0) {
        const sceneContainer = previousCompiledScene.elements[0].sceneContainer;
        sceneContainer.visible = false;
      }
    }

    // Показываем новую сцену (визуальный attach)
    if (sceneRef) {
      const compiledScene = this.compiledScenes.get(sceneRef.sceneId);
      if (compiledScene && compiledScene.elements.length > 0) {
        const sceneContainer = compiledScene.elements[0].sceneContainer;
        sceneContainer.visible = true;
      }
    }

    this.currentSceneId = sceneRef?.sceneId || null;
    this.currentSceneRef = sceneRef;
  }

  /**
   * Вычисляет state и обновляет элементы.
   * 
   * Pipeline сам:
   * - определяет активную сцену через program.getSceneAt(programTimeMs)
   * - вычисляет sceneTimeMs = clamp(programTimeMs - sceneRef.startMs, 0, sceneRefDurationMs)
   * - вычисляет timelineState = engine.getStateAt(sceneTimeMs)
   * - обновляет элементы
   * 
   * Time domains:
   * - ProgramTimeMs: время от начала Program (0..durationMs)
   * - SceneTimeMs: время от начала активной сцены (0..sceneDurationMs)
   * 
   * @param programTimeMs Время в миллисекундах относительно начала программы
   * @param dtMs Delta time в миллисекундах
   */
  tick(programTimeMs: number, dtMs: number): void {
    if (!this.program) {
      return;
    }

    // Определяем активную сцену
    const sceneRef = this.program.getSceneAt(programTimeMs);
    
    // Если сцена сменилась - переключаем
    if (sceneRef?.sceneId !== this.currentSceneId) {
      this.setActiveScene(sceneRef);
    }

    // Если нет активной сцены - выходим
    if (!sceneRef || !this.currentSceneId) {
      return;
    }

    const compiledScene = this.compiledScenes.get(this.currentSceneId);
    if (!compiledScene) {
      return;
    }

    // Вычисляем sceneTimeMs
    // sceneTimeMs = clamp(programTimeMs - sceneRef.startMs, 0, sceneRefDurationMs)
    const sceneRefDurationMs = sceneRef.endMs - sceneRef.startMs;
    const sceneTimeMs = Math.max(0, Math.min(programTimeMs - sceneRef.startMs, sceneRefDurationMs));

    // Вычисляем timelineState
    const timelineState = compiledScene.engine.getStateAt(sceneTimeMs);

    // Обновляем layout
    const layout = this.computeLayout();

    // Обновляем элементы
    for (const { element, container } of compiledScene.elements) {
      // Обновляем layout в контексте элемента
      const existingContext: ElementContext | undefined = getContainerContext(container);
      if (!existingContext) {
        setContainerContext(container, {
          container,
          viewport: this.viewport,
          layout,
        });
      } else {
        updateContainerLayout(container, layout);
      }

      // Обновляем элемент с состоянием timeline
      element.update(dtMs, timelineState);
    }
  }

  /**
   * Read-only методы для дебага (elements list, bounds, visibility, layout).
   */
  inspect(): PipelineInspectInfo {
    const elements: PipelineInspectInfo['elements'] = [];
    
    for (const [sceneId, compiledScene] of this.compiledScenes.entries()) {
      for (const { element, container } of compiledScene.elements) {
        const type = element.constructor.name.replace('Element', '').toLowerCase();
        elements.push({
          sceneId,
          element,
          container,
          type,
          visible: container.visible,
        });
      }
    }

    return {
      elements,
      activeSceneId: this.currentSceneId,
      viewport: this.viewport,
      layout: this.computeLayout(),
    };
  }

  /**
   * Получает bounding box элемента по sceneId и индексу элемента в сцене.
   */
  getElementBounds(sceneId: string, elementIndex: number): { x: number; y: number; width: number; height: number } | null {
    const compiledScene = this.compiledScenes.get(sceneId);
    if (!compiledScene || elementIndex < 0 || elementIndex >= compiledScene.elements.length) {
      return null;
    }
    
    const { container } = compiledScene.elements[elementIndex];
    const bounds = container.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  /**
   * Получает viewport для инспекции.
   */
  getViewport(): Viewport {
    return this.viewport;
  }

  /**
   * Получает текущий layout.
   */
  getLayout(): Layout {
    return this.computeLayout();
  }

  /**
   * Получает root container для добавления debug overlay.
   */
  getRootContainer(): PIXI.Container {
    return this.rootContainer;
  }

  /**
   * Получает текущую активную сцену.
   */
  getActiveSceneId(): string | null {
    return this.currentSceneId;
  }

  /**
   * Получает скомпилированную сцену по ID.
   */
  getCompiledScene(sceneId: string): CompiledScene | undefined {
    return this.compiledScenes.get(sceneId);
  }

  /**
   * Очищает все ресурсы.
   */
  dispose(): void {
    for (const compiledScene of this.compiledScenes.values()) {
      // Останавливаем TimelineEngine
      try {
        compiledScene.engine.stop();
      } catch (e) {
        console.warn('[RendererPipelineV1] Error stopping engine:', e);
      }

      // Dispose элементов
      for (const { element } of compiledScene.elements) {
        try {
          element.dispose();
          element.destroy();
        } catch (e) {
          console.warn('[RendererPipelineV1] Error disposing element:', e);
        }
      }

      // Очищаем sceneContainer
      if (compiledScene.elements.length > 0) {
        const sceneContainer = compiledScene.elements[0].sceneContainer;
        if (sceneContainer.parent) {
          sceneContainer.parent.removeChild(sceneContainer);
        }
        sceneContainer.destroy({ children: true });
      }
    }

    this.compiledScenes.clear();
    this.currentSceneId = null;
    this.currentSceneRef = null;
    this.program = null;
  }
}
