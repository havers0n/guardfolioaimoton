/**
 * ContainerContext - хранилище контекста для PIXI Container.
 * Использует WeakMap для хранения контекста элементов, так как userData может отсутствовать в PixiJS v8.
 */

import * as PIXI from 'pixi.js';
import type { ElementContext } from '../elements/Element';

const containerContextMap = new WeakMap<PIXI.Container, ElementContext>();

/**
 * Получает контекст элемента из контейнера.
 */
export function getContainerContext(container: PIXI.Container): ElementContext | undefined {
  return containerContextMap.get(container);
}

/**
 * Устанавливает контекст элемента для контейнера.
 */
export function setContainerContext(container: PIXI.Container, context: ElementContext): void {
  containerContextMap.set(container, context);
}

/**
 * Обновляет layout в контексте контейнера.
 */
export function updateContainerLayout(container: PIXI.Container, layout: ElementContext['layout']): void {
  const context = containerContextMap.get(container);
  if (context) {
    context.layout = layout;
  }
}

