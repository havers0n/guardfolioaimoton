/**
 * RendererPipeline - пайплайн рендеринга.
 * 
 * Отвечает за:
 * - compile(program) -> compiledScenes
 * - reconcileElements(targetElements)
 * - render(frameState)
 */

import type { Program, SceneState } from '../programs/types';
import type { ElementConfig } from '../elements/registry';
import type { Element } from '../elements/Element';
import { createElements, mountElements } from '../elements/elementFactory';
import type { Viewport } from './viewport';
import type { Layout } from './layout/layout';
import { getContainerContext, setContainerContext, updateContainerLayout } from './containerContext';
import type { ElementContext } from '../elements/Element';
import * as PIXI from 'pixi.js';

/**
 * CompiledScene - скомпилированная сцена с элементами.
 */
export interface CompiledScene {
  sceneId: string;
  elements: Array<{ element: Element; container: PIXI.Container }>;
}

/**
 * FrameState - состояние кадра для рендеринга.
 */
export interface FrameState {
  sceneState: SceneState | null;
  dt: number; // Delta time в миллисекундах
}

/**
 * RendererPipeline - пайплайн рендеринга.
 */
export class RendererPipeline {
  private compiledScenes: Map<string, CompiledScene> = new Map();
  private currentSceneId: string | null = null;
  private rootContainer: PIXI.Container;
  private viewport: Viewport;
  private computeLayout: () => Layout;

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
   * Создаёт элементы для каждой сцены.
   */
  compile(program: Program): void {
    this.compiledScenes.clear();

    const scenes = program.getScenes();
    for (const sceneDef of scenes) {
      const elementConfigs = program.getElementsForScene(sceneDef.id);
      const layout = this.computeLayout();

      // Создаём элементы
      const elementsWithZIndex = createElements(elementConfigs);

      // Создаём контейнер для сцены
      const sceneContainer = new PIXI.Container();
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
        sceneId: sceneDef.id,
        elements: elementsWithZIndex.map(({ element }) => ({
          element,
          container: elementContainers.get(element)!,
        })),
      };

      this.compiledScenes.set(sceneDef.id, compiledScene);
    }

    console.log('[RendererPipeline] Compiled program:', {
      scenes: this.compiledScenes.size,
      totalElements: Array.from(this.compiledScenes.values()).reduce(
        (sum, scene) => sum + scene.elements.length,
        0
      ),
    });
  }

  /**
   * Согласовывает элементы (reconciliation).
   * Переключает видимость сцен в зависимости от активной сцены.
   */
  reconcileElements(sceneState: SceneState | null): void {
    if (!sceneState) {
      // Скрываем все сцены
      for (const compiledScene of this.compiledScenes.values()) {
        for (const { container } of compiledScene.elements) {
          container.visible = false;
        }
      }
      return;
    }

    // Показываем только активную сцену
    for (const [sceneId, compiledScene] of this.compiledScenes.entries()) {
      const isActive = sceneId === sceneState.sceneId;
      for (const { container } of compiledScene.elements) {
        container.visible = isActive;
      }
    }

    this.currentSceneId = sceneState.sceneId;
  }

  /**
   * Рендерит кадр с указанным состоянием.
   */
  render(frameState: FrameState): void {
    const { sceneState, dt } = frameState;

    // Согласовываем элементы
    this.reconcileElements(sceneState);

    // Обновляем элементы активной сцены
    if (sceneState) {
      const compiledScene = this.compiledScenes.get(sceneState.sceneId);
      if (compiledScene) {
        const layout = this.computeLayout();

        for (const { element, container } of compiledScene.elements) {
          // Обновляем layout в контексте элемента через containerContext (WeakMap, не userData)
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
          if (sceneState.timelineState) {
            element.update(dt, sceneState.timelineState);
          }
        }
      }
    }
  }

  /**
   * Получает все элементы для инспекции.
   * Возвращает элементы из активной сцены или всех сцен, если активной нет.
   */
  getElements(): Array<{ element: Element; container: PIXI.Container; type: string }> {
    const allElements: Array<{ element: Element; container: PIXI.Container; type: string }> = [];
    
    for (const compiledScene of this.compiledScenes.values()) {
      for (const { element, container } of compiledScene.elements) {
        const type = element.constructor.name.replace('Element', '').toLowerCase();
        allElements.push({ element, container, type });
      }
    }
    
    return allElements;
  }

  /**
   * Устанавливает видимость элемента по индексу (из getElements).
   */
  setElementVisible(index: number, visible: boolean): void {
    const elements = this.getElements();
    if (index < 0 || index >= elements.length) {
      return;
    }
    elements[index].container.visible = visible;
  }

  /**
   * Получает видимость элемента по индексу.
   */
  getElementVisible(index: number): boolean {
    const elements = this.getElements();
    if (index < 0 || index >= elements.length) {
      return false;
    }
    return elements[index].container.visible;
  }

  /**
   * Получает bounding box элемента по индексу.
   */
  getElementBounds(index: number): { x: number; y: number; width: number; height: number } | null {
    const elements = this.getElements();
    if (index < 0 || index >= elements.length) {
      return null;
    }
    const { container } = elements[index];
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
   * Очищает все ресурсы.
   */
  dispose(): void {
    for (const compiledScene of this.compiledScenes.values()) {
      for (const { element, container } of compiledScene.elements) {
        try {
          element.dispose();
          element.destroy();
        } catch (e) {
          console.warn('[RendererPipeline] Error disposing element:', e);
        }
      }
    }

    this.compiledScenes.clear();
    this.currentSceneId = null;
  }
}
